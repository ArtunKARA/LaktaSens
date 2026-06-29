#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Devre baglantilari:
// D5  -> Debimetre sinyal cikisi. 5V sinyal icin 10k/20k bolucu ile 3.3V seviyesine dusur.
// D2  -> LCD SDA
// D1  -> LCD SCL
// D0  -> Led1K
// D3  -> Led2S
// D4  -> Led3Y
// D8  -> Buzzer
// D6  -> ButtonDur, GND'ye basar, INPUT_PULLUP
// D7  -> ButtonBitir, GND'ye basar, INPUT_PULLUP
// VIN -> Harici 5V besleme, GND hatlari ortak olmali.

#define FLOW_PIN D5
#define LCD_SDA D2
#define LCD_SCL D1
#define LED_K D0
#define LED_S D3
#define LED_Y D4
#define BUZZER_PIN D8
#define BUTTON_DUR D6
#define BUTTON_BITIR D7

const char* ssid = "Redmi";
const char* password = "ankara06";

const char* serverBase = "http://10.41.12.147:3030";
const char* sensorQr = "f2dw2iGzdQXgT0cp";

const float FLOW_PULSES_PER_LITER = 450.0;
const unsigned long pollIntervalMs = 3000;
const unsigned long screenIntervalMs = 500;
const unsigned long debounceMs = 80;

LiquidCrystal_I2C lcd(0x27, 16, 2);

volatile unsigned long flowPulseCount = 0;
unsigned long lastPollAt = 0;
unsigned long lastScreenAt = 0;
unsigned long lastDurPressAt = 0;
unsigned long lastBitirPressAt = 0;

int activeJobId = 0;
String activeCowId = "";
bool measuring = false;
bool paused = false;

void IRAM_ATTR onFlowPulse() {
  if (measuring && !paused) {
    flowPulseCount++;
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(FLOW_PIN, INPUT);
  pinMode(LED_K, OUTPUT);
  pinMode(LED_S, OUTPUT);
  pinMode(LED_Y, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_DUR, INPUT_PULLUP);
  pinMode(BUTTON_BITIR, INPUT_PULLUP);

  digitalWrite(LED_K, LOW);
  digitalWrite(LED_S, LOW);
  digitalWrite(LED_Y, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  showLcd("LaktaSens", "Baslatiliyor");

  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), onFlowPulse, RISING);

  connectToWiFi();
  sendOnlineStatus();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setStatusLeds(true, false, false);
    connectToWiFi();
  }

  handleButtons();

  if (measuring) {
    updateMeasurementScreen();
    return;
  }

  if (millis() - lastPollAt < pollIntervalMs) {
    return;
  }

  lastPollAt = millis();
  setStatusLeds(false, true, false);
  showLcd("Is emri", "Sorgulaniyor");

  String activeJobResponse = queryActiveJob();

  if (activeJobResponse.indexOf("\"hasJob\":true") == -1) {
    setStatusLeds(false, false, true);
    showLcd("Hazir", WiFi.localIP().toString());
    return;
  }

  int jobId = extractJsonInt(activeJobResponse, "id");
  String cowId = extractJsonString(activeJobResponse, "cowId");

  if (jobId <= 0) {
    setStatusLeds(true, false, false);
    showLcd("Is emri hata", "ID okunamadi");
    beep(2, 120);
    return;
  }

  startMeasurement(jobId, cowId);
}

void connectToWiFi() {
  showLcd("WiFi", "Baglaniyor");
  Serial.println("WiFi baglaniyor...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    blinkPin(LED_S, 1, 180);
    Serial.print(".");
    delay(100);
  }

  Serial.println("\nWiFi baglandi.");
  Serial.println("NodeMCU IP: " + WiFi.localIP().toString());
  Serial.println("API: " + String(serverBase));
  showLcd("WiFi baglandi", WiFi.localIP().toString());
  setStatusLeds(false, false, true);
  beep(1, 120);
  delay(900);
}

void startMeasurement(int jobId, String cowId) {
  noInterrupts();
  flowPulseCount = 0;
  interrupts();

  activeJobId = jobId;
  activeCowId = cowId;
  measuring = true;
  paused = false;

  setStatusLeds(false, true, false);
  showLcd("Olcum basladi", "Inek: " + cowId);
  beep(1, 180);
  Serial.println("Olcum basladi. Is emri #" + String(jobId) + ", inek=" + cowId);
}

void finishMeasurement() {
  float liters = currentLiters();

  measuring = false;
  paused = false;
  setStatusLeds(false, true, false);
  showLcd("Gonderiliyor", String(liters, 2) + " L");

  String response = sendMeasurement(activeJobId, liters);

  if (response.indexOf("Olcum kaydedildi") != -1 || response.indexOf("\"status\":\"completed\"") != -1) {
    setStatusLeds(false, false, true);
    showLcd("Tamamlandi", String(liters, 2) + " L");
    beep(2, 100);
  } else {
    setStatusLeds(true, false, false);
    showLcd("Gonderim hata", "Serial bak");
    beep(4, 120);
  }

  Serial.println("Olcum cevabi: " + response);
  activeJobId = 0;
  activeCowId = "";
  delay(1500);
}

void handleButtons() {
  unsigned long now = millis();

  if (digitalRead(BUTTON_DUR) == LOW && now - lastDurPressAt > debounceMs) {
    lastDurPressAt = now;

    if (measuring) {
      paused = !paused;
      setStatusLeds(paused, !paused, false);
      showLcd(paused ? "Duraklatildi" : "Olcum suruyor", String(currentLiters(), 2) + " L");
      beep(1, 80);
    }
  }

  if (digitalRead(BUTTON_BITIR) == LOW && now - lastBitirPressAt > debounceMs) {
    lastBitirPressAt = now;

    if (measuring) {
      finishMeasurement();
    }
  }
}

void updateMeasurementScreen() {
  if (millis() - lastScreenAt < screenIntervalMs) {
    return;
  }

  lastScreenAt = millis();
  String line1 = paused ? "Duraklatildi" : "Olcum: " + String(currentLiters(), 2) + " L";
  String line2 = "Bitir:D7 Dur:D6";
  showLcd(line1, line2);
}

float currentLiters() {
  noInterrupts();
  unsigned long pulses = flowPulseCount;
  interrupts();

  return pulses / FLOW_PULSES_PER_LITER;
}

String sendOnlineStatus() {
  String url = String(serverBase) + "/api/mobile/sensor/online";
  String body = "{\"sensorQr\":\"" + String(sensorQr) + "\"}";
  return postJson(url, body);
}

String queryActiveJob() {
  String url = String(serverBase) + "/api/mobile/sensor/jobs/active?sensorQr=" + String(sensorQr);
  return getUrl(url);
}

String sendMeasurement(int jobId, float liters) {
  String url = String(serverBase) + "/api/mobile/sensor/measurements";
  String body = "{";
  body += "\"sensorQr\":\"" + String(sensorQr) + "\",";
  body += "\"jobId\":" + String(jobId) + ",";
  body += "\"liters\":" + String(liters, 2);
  body += "}";

  return postJson(url, body);
}

String getUrl(String url) {
  if (WiFi.status() != WL_CONNECTED) {
    return "";
  }

  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  int code = http.GET();
  String response = code > 0 ? http.getString() : "";
  Serial.println("GET " + url + " -> " + String(code));
  Serial.println(response);
  http.end();
  return response;
}

String postJson(String url, String body) {
  if (WiFi.status() != WL_CONNECTED) {
    return "";
  }

  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String response = code > 0 ? http.getString() : "";
  Serial.println("POST " + url + " -> " + String(code));
  Serial.println(body);
  Serial.println(response);
  http.end();
  return response;
}

int extractJsonInt(String json, String key) {
  String token = "\"" + key + "\":";
  int start = json.indexOf(token);
  if (start == -1) {
    return 0;
  }

  start += token.length();
  int end = start;
  while (end < json.length() && isDigit(json[end])) {
    end++;
  }

  return json.substring(start, end).toInt();
}

String extractJsonString(String json, String key) {
  String token = "\"" + key + "\":\"";
  int start = json.indexOf(token);
  if (start == -1) {
    return "";
  }

  start += token.length();
  int end = json.indexOf("\"", start);
  if (end == -1) {
    return "";
  }

  return json.substring(start, end);
}

void showLcd(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(fitLcd(line1));
  lcd.setCursor(0, 1);
  lcd.print(fitLcd(line2));
}

String fitLcd(String value) {
  if (value.length() > 16) {
    return value.substring(0, 16);
  }

  while (value.length() < 16) {
    value += " ";
  }

  return value;
}

void setStatusLeds(bool red, bool yellow, bool green) {
  digitalWrite(LED_K, red ? HIGH : LOW);
  digitalWrite(LED_S, yellow ? HIGH : LOW);
  digitalWrite(LED_Y, green ? HIGH : LOW);
}

void beep(int count, int delayMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(delayMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(delayMs);
  }
}

void blinkPin(int pin, int count, int delayMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
  }
}
