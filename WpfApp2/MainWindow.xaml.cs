using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.Web.WebView2.Core;

namespace WpfApp2
{
    public partial class MainWindow : Window
    {
        private readonly string _indexPath;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _prefsPath;
        private const double DefaultWidth = 896;
        private const double DefaultHeight = 768;
        private const double DefaultLeft = 1024;
        private const double DefaultTop = 0;
        private const int MonthsBackBatch = 6;
        private CalendarService? _calendarService;
        private DateTimeOffset _loadedStart;

        public MainWindow()
        {
            InitializeComponent();
            _indexPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");
            var secrets = LoadGoogleSecrets();
            _clientId = secrets.clientId;
            _clientSecret = secrets.clientSecret;
            _prefsPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "WpfShadcnCalendar",
                "window.json");
            var startOfMonth = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
            _loadedStart = new DateTimeOffset(startOfMonth.AddMonths(-MonthsBackBatch));
            Loaded += OnLoaded;
            Closing += OnClosing;
        }

        private async void OnLoaded(object sender, RoutedEventArgs e)
        {
            if (!File.Exists(_indexPath))
            {
                MessageBox.Show($"Cannot find {_indexPath}. Ensure the web assets are copied to the output folder.", "Missing assets",
                    MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            LoadWindowPreferences();

            await CalendarView.EnsureCoreWebView2Async();
            CalendarView.Source = new Uri(_indexPath);
            CalendarView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            CalendarView.NavigationCompleted += OnNavigationCompleted;

            LoadIcons();
        }

        private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            _ = LoadCalendarAsync();
        }

        private void OnClosing(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            SaveWindowPreferences();
        }

        private async Task<CalendarService?> EnsureCalendarServiceAsync()
        {
            if (string.IsNullOrWhiteSpace(_clientId) || string.IsNullOrWhiteSpace(_clientSecret))
            {
                MessageBox.Show("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경 변수를 설정하세요.", "Google API 설정 필요",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return null;
            }

            try
            {
                if (_calendarService != null)
                    return _calendarService;

                var scopes = new[] { CalendarService.Scope.CalendarReadonly, CalendarService.Scope.CalendarEvents };
                var credentials = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                    new ClientSecrets { ClientId = _clientId, ClientSecret = _clientSecret },
                    scopes,
                    "user",
                    CancellationToken.None,
                    // bump the store key to force re-consent when scopes change
                    new FileDataStore("WpfShadcnCalendar.v2"));

                _calendarService = new CalendarService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credentials,
                    ApplicationName = "Shadcn WebView2 Calendar"
                });

                return _calendarService;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Google Calendar 초기화 실패: {ex.Message}", "Google API 오류",
                    MessageBoxButton.OK, MessageBoxImage.Error);
                return null;
            }
        }

        private async Task LoadCalendarAsync(DateTimeOffset? timeMinOverride = null)
        {
            var service = await EnsureCalendarServiceAsync();
            if (service == null)
                return;

            try
            {
                var request = service.Events.List("primary");
                var start = timeMinOverride ?? _loadedStart;
                request.TimeMinDateTimeOffset = start;
                request.SingleEvents = true;
                request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;
                request.MaxResults = 250;

                // Page through all results so going further back does not drop recent items due to API paging.
                var allItems = new System.Collections.Generic.List<Event>();
                Events events;
                do
                {
                    events = await request.ExecuteAsync();
                    if (events.Items != null)
                        allItems.AddRange(events.Items);
                    request.PageToken = events.NextPageToken;
                } while (!string.IsNullOrEmpty(request.PageToken));

                _loadedStart = start;

                var normalized = allItems
                    .Where(e => e.Start != null)
                    .Select(e =>
                    {
                        var allDay = e.Start.Date != null;
                        var startDateKey = e.Start.Date ?? e.Start.DateTime?.ToLocalTime().ToString("yyyy-MM-dd");
                        if (startDateKey == null) return null;

                        var endRaw = e.End?.Date ?? e.End?.DateTime?.ToLocalTime().ToString("yyyy-MM-dd") ?? startDateKey;
                        string endDateKey;
                        string? startTime = null;
                        string? endTime = null;
                        var location = e.Location ?? string.Empty;
                        int? reminderMinutes = null;

                        if (allDay)
                        {
                            var endParsed = DateTime.Parse(endRaw, CultureInfo.InvariantCulture);
                            endParsed = endParsed.AddDays(-1); // Google all-day end is exclusive
                            if (endParsed < DateTime.Parse(startDateKey, CultureInfo.InvariantCulture))
                                endParsed = DateTime.Parse(startDateKey, CultureInfo.InvariantCulture);
                            endDateKey = endParsed.ToString("yyyy-MM-dd");
                        }
                        else
                        {
                            endDateKey = endRaw;
                            startTime = e.Start.DateTime?.ToLocalTime().ToString("HH:mm");
                            endTime = e.End?.DateTime?.ToLocalTime().ToString("HH:mm");
                            if (e.Reminders?.Overrides != null && e.Reminders.Overrides.Count > 0)
                            {
                                var first = e.Reminders.Overrides.FirstOrDefault(r => r.Method == "popup");
                                if (first?.Minutes != null)
                                {
                                    reminderMinutes = first.Minutes;
                                }
                            }
                        }

                        return new
                        {
                            id = e.Id,
                            title = e.Summary ?? "(no title)",
                            startDateKey,
                            endDateKey,
                            startTime,
                            endTime,
                            allDay,
                            location,
                            reminderMinutes
                        };
                    })
                    .Where(e => e != null)
                    .ToArray();

                if (CalendarView.CoreWebView2 == null)
                    return;

                var payload = JsonSerializer.Serialize(new { kind = "events", items = normalized });
                CalendarView.CoreWebView2.PostWebMessageAsJson(payload);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Google Calendar 불러오기 실패: {ex.Message}", "Google API 오류",
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                using var doc = JsonDocument.Parse(e.WebMessageAsJson);
                if (!doc.RootElement.TryGetProperty("kind", out var kindProp))
                    return;

                var kind = kindProp.GetString();
                if (kind == "createEvent")
                {
                    var title = doc.RootElement.GetProperty("title").GetString() ?? "New Event";
                    var time = doc.RootElement.GetProperty("time").GetString() ?? "All day";
                    var endTime = doc.RootElement.TryGetProperty("endTime", out var endTimeProp) ? endTimeProp.GetString() : null;
                    var dateKey = doc.RootElement.GetProperty("dateKey").GetString() ?? string.Empty;
                    var endDateKey = doc.RootElement.TryGetProperty("endDateKey", out var endDateProp) ? endDateProp.GetString() ?? dateKey : dateKey;
                    var allDay = doc.RootElement.TryGetProperty("allDay", out var allDayProp) && allDayProp.GetBoolean();
                    var location = doc.RootElement.TryGetProperty("location", out var locProp) ? locProp.GetString() ?? string.Empty : string.Empty;
                    int? reminderMinutes = null;
                    if (doc.RootElement.TryGetProperty("reminderMinutes", out var remProp) && remProp.ValueKind == JsonValueKind.Number)
                    {
                        if (remProp.TryGetInt32(out var m)) reminderMinutes = m;
                    }
                    await CreateEventAsync(title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes);
                    await LoadCalendarAsync(); // refresh UI with new data
                }
                else if (kind == "editEvent")
                {
                    var id = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;
                    var title = doc.RootElement.GetProperty("title").GetString() ?? "Event";
                    var time = doc.RootElement.GetProperty("time").GetString() ?? "All day";
                    var endTime = doc.RootElement.TryGetProperty("endTime", out var endTimeProp) ? endTimeProp.GetString() : null;
                    var dateKey = doc.RootElement.GetProperty("dateKey").GetString() ?? string.Empty;
                    var endDateKey = doc.RootElement.TryGetProperty("endDateKey", out var endDateProp) ? endDateProp.GetString() ?? dateKey : dateKey;
                    var allDay = doc.RootElement.TryGetProperty("allDay", out var allDayProp) && allDayProp.GetBoolean();
                    var location = doc.RootElement.TryGetProperty("location", out var locProp) ? locProp.GetString() ?? string.Empty : string.Empty;
                    int? reminderMinutes = null;
                    if (doc.RootElement.TryGetProperty("reminderMinutes", out var remProp) && remProp.ValueKind == JsonValueKind.Number)
                    {
                        if (remProp.TryGetInt32(out var m)) reminderMinutes = m;
                    }
                    await UpdateEventAsync(id, title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes);
                    await LoadCalendarAsync();
                }
                else if (kind == "deleteEvent")
                {
                    var id = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;
                    await DeleteEventAsync(id);
                    await LoadCalendarAsync();
                }
                else if (kind == "sync")
                {
                    await LoadCalendarAsync();
                }
                else if (kind == "ensureRange")
                {
                    var fromKey = doc.RootElement.TryGetProperty("from", out var fromProp) ? fromProp.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(fromKey) && DateTime.TryParse(fromKey, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var fromDate))
                    {
                        var startOfMonth = new DateTime(fromDate.Year, fromDate.Month, 1);
                        var newStart = new DateTimeOffset(startOfMonth.AddMonths(-MonthsBackBatch));
                        // Only extend further back when the requested month is earlier than our current window.
                        if (newStart < _loadedStart.AddDays(-1))
                        {
                            await LoadCalendarAsync(newStart);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"메시지 처리 오류: {ex.Message}", "WebView 메시지", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async Task CreateEventAsync(string title, string time, string? endTime, string dateKey, string endDateKey, bool allDay, string location, int? reminderMinutes)
        {
            var service = await EnsureCalendarServiceAsync();
            if (service == null || string.IsNullOrWhiteSpace(dateKey))
                return;

            var ev = new Event
            {
                Summary = title,
                Location = string.IsNullOrWhiteSpace(location) ? null : location
            };

            // All-day vs. timed event
            if (allDay || string.IsNullOrWhiteSpace(time) || time.Equals("All day", StringComparison.OrdinalIgnoreCase))
            {
                ev.Start = new EventDateTime { Date = dateKey };
                var endDate = string.IsNullOrWhiteSpace(endDateKey) ? dateKey : endDateKey;
                ev.End = new EventDateTime { Date = DateTime.Parse(endDate, CultureInfo.InvariantCulture).AddDays(1).ToString("yyyy-MM-dd") };
            }
            else
            {
                if (!DateTime.TryParse($"{dateKey} {time}", CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out var start))
                {
                    start = DateTime.Parse(dateKey, CultureInfo.InvariantCulture);
                }
                var endDate = string.IsNullOrWhiteSpace(endDateKey) ? dateKey : endDateKey;
                DateTime endCandidate;
                if (!DateTime.TryParse($"{endDate} {endTime ?? time}", CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out endCandidate))
                {
                    endCandidate = start.AddHours(1);
                }
                ev.Start = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(start) };
                ev.End = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(endCandidate) };
            }

            if (reminderMinutes.HasValue)
            {
                ev.Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new[]
                    {
                        new EventReminder
                        {
                            Method = "popup",
                            Minutes = reminderMinutes.Value
                        }
                    }
                };
            }
            else
            {
                // No reminder when null/empty
                ev.Reminders = new Event.RemindersData { UseDefault = false, Overrides = new EventReminder[0] };
            }

            try
            {
                await service.Events.Insert(ev, "primary").ExecuteAsync();
            }
            catch (Google.GoogleApiException gex)
            {
                MessageBox.Show($"Google Calendar 이벤트 저장 실패: {gex.Message}", "Google API 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                throw;
            }
        }

        private async Task UpdateEventAsync(string id, string title, string time, string? endTime, string dateKey, string endDateKey, bool allDay, string location, int? reminderMinutes)
        {
            var service = await EnsureCalendarServiceAsync();
            if (service == null || string.IsNullOrWhiteSpace(id))
                return;

            var existing = await service.Events.Get("primary", id).ExecuteAsync();
            if (existing == null) return;

            existing.Summary = title;
            existing.Location = string.IsNullOrWhiteSpace(location) ? null : location;

            if (allDay || string.IsNullOrWhiteSpace(time) || time.Equals("All day", StringComparison.OrdinalIgnoreCase))
            {
                existing.Start = new EventDateTime { Date = dateKey };
                var endDate = string.IsNullOrWhiteSpace(endDateKey) ? dateKey : endDateKey;
                existing.End = new EventDateTime { Date = DateTime.Parse(endDate, CultureInfo.InvariantCulture).AddDays(1).ToString("yyyy-MM-dd") };
            }
            else
            {
                if (!DateTime.TryParse($"{dateKey} {time}", CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out var start))
                {
                    start = DateTime.Parse(dateKey, CultureInfo.InvariantCulture);
                }
                var endDate = string.IsNullOrWhiteSpace(endDateKey) ? dateKey : endDateKey;
                DateTime endCandidate;
                if (!DateTime.TryParse($"{endDate} {endTime ?? time}", CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out endCandidate))
                {
                    endCandidate = start.AddHours(1);
                }
                existing.Start = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(start) };
                existing.End = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(endCandidate) };
            }

            if (reminderMinutes.HasValue)
            {
                existing.Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new[]
                    {
                        new EventReminder
                        {
                            Method = "popup",
                            Minutes = reminderMinutes.Value
                        }
                    }
                };
            }
            else
            {
                existing.Reminders = new Event.RemindersData { UseDefault = false, Overrides = new EventReminder[0] };
            }

            await service.Events.Update(existing, "primary", id).ExecuteAsync();
        }

        private async Task DeleteEventAsync(string id)
        {
            var service = await EnsureCalendarServiceAsync();
            if (service == null || string.IsNullOrWhiteSpace(id))
                return;

            await service.Events.Delete("primary", id).ExecuteAsync();
        }

        private void LoadWindowPreferences()
        {
            try
            {
                if (File.Exists(_prefsPath))
                {
                    var json = File.ReadAllText(_prefsPath);
                    var prefs = JsonSerializer.Deserialize<WindowPrefs>(json);
                    if (prefs != null)
                    {
                        Width = prefs.Width;
                        Height = prefs.Height;
                        Left = prefs.Left;
                        Top = prefs.Top;
                        WindowState = prefs.State;
                        return;
                    }
                }

                // Defaults when no prefs
                Width = DefaultWidth;
                Height = DefaultHeight;
                Left = DefaultLeft;
                Top = DefaultTop;
            }
            catch
            {
                // ignore bad prefs; fall back to defaults
            }
        }

        private void SaveWindowPreferences()
        {
            try
            {
                var dir = Path.GetDirectoryName(_prefsPath);
                if (!string.IsNullOrWhiteSpace(dir) && !Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                var bounds = WindowState == WindowState.Normal ? new Rect(Left, Top, Width, Height) : RestoreBounds;

                var prefs = new WindowPrefs
                {
                    Width = bounds.Width,
                    Height = bounds.Height,
                    Left = bounds.Left,
                    Top = bounds.Top,
                    State = WindowState == WindowState.Minimized ? WindowState.Normal : WindowState
                };

                var json = JsonSerializer.Serialize(prefs);
                File.WriteAllText(_prefsPath, json);
            }
            catch
            {
                // ignore save failures
            }
        }

        private static (string clientId, string clientSecret) LoadGoogleSecrets()
        {
            var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? string.Empty;
            var clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? string.Empty;
            var localPath = Path.Combine(AppContext.BaseDirectory, "secrets.local.json");
            if (!File.Exists(localPath))
                return (clientId, clientSecret);

            try
            {
                using var doc = JsonDocument.Parse(File.ReadAllText(localPath));
                var root = doc.RootElement;
                if (string.IsNullOrWhiteSpace(clientId))
                {
                    if (root.TryGetProperty("GOOGLE_CLIENT_ID", out var cidProp))
                        clientId = cidProp.GetString() ?? clientId;
                    else if (root.TryGetProperty("clientId", out var cidAlt))
                        clientId = cidAlt.GetString() ?? clientId;
                }
                if (string.IsNullOrWhiteSpace(clientSecret))
                {
                    if (root.TryGetProperty("GOOGLE_CLIENT_SECRET", out var csProp))
                        clientSecret = csProp.GetString() ?? clientSecret;
                    else if (root.TryGetProperty("clientSecret", out var csAlt))
                        clientSecret = csAlt.GetString() ?? clientSecret;
                }
            }
            catch
            {
                // ignore bad local secrets
            }

            return (clientId, clientSecret);
        }

        private class WindowPrefs
        {
            public double Width { get; set; }
            public double Height { get; set; }
            public double Left { get; set; }
            public double Top { get; set; }
            public WindowState State { get; set; }
        }

        private void LoadIcons()
        {
            void SetIcon(Image target, string fileName)
            {
                var path = Path.Combine(AppContext.BaseDirectory, "wwwroot", "assets", fileName);
                if (!File.Exists(path)) return;
                target.Source = new BitmapImage(new Uri(path));
            }

            SetIcon(MinIcon, "minus.png");
            SetIcon(MaxIcon, "square.png");
            SetIcon(CloseIcon, "x.png");
        }

        private void TopBar_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                if (e.ClickCount == 2)
                {
                    ToggleMaxRestore();
                }
                else
                {
                    try { DragMove(); } catch { /* ignore drag errors */ }
                }
            }
        }

        private void ToggleMaxRestore()
        {
            WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
        }

        private void MinButton_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
        private void MaxButton_Click(object sender, RoutedEventArgs e) => ToggleMaxRestore();
        private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();
    }
}
