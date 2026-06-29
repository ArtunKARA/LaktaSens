#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define USE_LCD 1
#define LCD_ADDRESS 0x27
#define BUZZER_USE_TONE 1

#if USE_LCD
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);
#endif

#define RED_LED D0
#define YELLOW_LED D3
#define GREEN_LED D4
#define FLOW_SENSOR_PIN D5
#define STOP_BUTTON_PIN D6
#define FINISH_BUTTON_PIN D7
#define BUZZER_PIN D8

const char *ssid = "Penguen";
const char *password = "P20202020";

// Mobil API ile ayni sunucu. Fiziksel testte bilgisayarin LAN IP adresini yaz.
const char *serverBase = "http://10.41.12.147:3030";
const char *sensorQr = "8266";

const unsigned long pollIntervalMs = 3000;
const unsigned long statusIntervalMs = 1000;
const unsigned long liveMeasurementIntervalMs = 1500;
const unsigned long buttonDebounceMs = 45;
const unsigned long errorSoundIntervalMs = 10000;
const float minLiveMeasurementDeltaLiters = 0.01;
const unsigned long yellowBlinkIntervalMs = 350;
const unsigned long measuringSoundIntervalMs = 2000;

// YF-S402C: F = 23 * Q(L/min). 23 pulse/s at 1 L/min => 1380 pulse/L.
// Sahada olcekli kap ile kalibre edip bu degeri guncelle.
const float flowPulsesPerLiter = 1380.0;

struct ButtonState
{
  uint8_t pin;
  int stableState;
  int lastReading;
  unsigned long lastChangeAt;
};

ButtonState stopButton = {STOP_BUTTON_PIN, HIGH, HIGH, 0};
ButtonState finishButton = {FINISH_BUTTON_PIN, HIGH, HIGH, 0};

volatile unsigned long flowPulseCount = 0;
volatile bool measurementActive = false;
volatile bool measurementPaused = false;

unsigned long lastPollAt = 0;
unsigned long lastErrorSoundAt = 0;
unsigned long lastYellowBlinkAt = 0;
bool yellowBlinkState = false;

void connectToWiFi();
String sendOnlineStatus();
String queryActiveJob();
String sendMeasurement(int jobId, float liters, bool finalMeasurement);
String sendMeasurement(int jobId, float liters, bool finalMeasurement);
void runMeasurement(int jobId, const String &cowId);
void resetFlowCounter();
unsigned long getFlowPulses();
float pulsesToLiters(unsigned long pulses);
String getUrl(String url);
String postJson(String url, String body);
int extractJsonInt(String json, String key);
String extractJsonString(String json, String key);
bool buttonPressed(ButtonState &button);
void setLeds(bool red, bool yellow, bool green);
void setYellowLed(bool on);
void startYellowBlink();
void updateYellowBlink();
void setIdleState();
void setMeasuringState();
void setPausedState();
void setSendingState();
void setSuccessState();
void blink(uint8_t pin, int count, int delayMs);
void beep(int count, int delayMs);
void playToneMs(unsigned int frequency, unsigned int durationMs);
void playStartupMelody();
void playWiFiSound();
void playJobFoundSound();
void playPauseSound();
void playResumeSound();
void playMeasuringTickSound();
void playSuccessSound();
void playErrorSound();
void playErrorSoundThrottled();
void showMeasurementStatus(const String &cowId, float liters);
void showStatus(const String &line1, const String &line2);

void IRAM_ATTR countFlowPulse()
{
  if (measurementActive && !measurementPaused)
  {
    flowPulseCount++;
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  pinMode(STOP_BUTTON_PIN, INPUT_PULLUP);
  pinMode(FINISH_BUTTON_PIN, INPUT_PULLUP);

  setLeds(false, false, false);
  digitalWrite(BUZZER_PIN, LOW);

#if USE_LCD
  Wire.begin(D2, D1);
  lcd.init();
  lcd.backlight();
#endif

  showStatus("Sensor ID", String(sensorQr));
  playStartupMelody();

  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), countFlowPulse, RISING);

  connectToWiFi();
  String onlineResponse = sendOnlineStatus();
  if (onlineResponse.indexOf("\"online\":true") != -1)
  {
    showStatus("Sensor aktif", "Is bekleniyor");
    setIdleState();
  }
  else
  {
    showStatus("Sensor hatasi", "QR/API kontrol");
    playErrorSoundThrottled();
    blink(RED_LED, 3, 180);
  }
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    connectToWiFi();
    sendOnlineStatus();
  }

  if (millis() - lastPollAt < pollIntervalMs)
  {
    delay(50);
    return;
  }

  lastPollAt = millis();
  String activeJobResponse = queryActiveJob();

  if (activeJobResponse.length() == 0)
  {
    showStatus("API cevapsiz", "Sunucu kontrol");
    playErrorSoundThrottled();
    blink(RED_LED, 2, 180);
    return;
  }

  if (activeJobResponse.indexOf("\"hasJob\":false") != -1)
  {
    showStatus("Is emri yok", "Bekleniyor");
    setIdleState();
    return;
  }

  if (activeJobResponse.indexOf("\"hasJob\":true") == -1)
  {
    showStatus("Gecersiz cevap", "API kontrol");
    playErrorSoundThrottled();
    blink(RED_LED, 2, 180);
    return;
  }

  int jobId = extractJsonInt(activeJobResponse, "id");
  String cowId = extractJsonString(activeJobResponse, "cowId");
  String cowInfo = extractJsonString(activeJobResponse, "cowName");
  if (cowInfo.length() == 0)
  {
    cowInfo = cowId;
  }

  if (jobId <= 0)
  {
    Serial.println("Is emri ID okunamadi.");
    showStatus("Is ID hatasi", "API kontrol");
    playErrorSoundThrottled();
    blink(RED_LED, 2, 180);
    return;
  }

  Serial.println("Acik is emri bulundu: #" + String(jobId) + " inek=" + cowId);
  runMeasurement(jobId, cowInfo);
}

void runMeasurement(int jobId, const String &cowId)
{
  resetFlowCounter();
  measurementActive = true;
  measurementPaused = false;

  unsigned long lastStatusAt = millis();
  unsigned long lastLiveSendAt = 0;
  unsigned long lastPulseSnapshot = 0;
  unsigned long lastFlowCalcAt = millis();
  float lastLiveSentLiters = 0.0;
  unsigned long lastMeasuringSoundAt = millis();
  bool shouldFinish = false;

  setMeasuringState();
  playJobFoundSound();
  showMeasurementStatus(cowId, 0.0);

  while (!shouldFinish)
  {
    updateYellowBlink();

    if (WiFi.status() != WL_CONNECTED)
    {
      connectToWiFi();
      if (measurementPaused)
      {
        setPausedState();
      }
      else
      {
        setMeasuringState();
      }
    }

    if (buttonPressed(stopButton))
    {
      measurementPaused = !measurementPaused;
      if (measurementPaused)
      {
        setPausedState();
        showMeasurementStatus(cowId, pulsesToLiters(getFlowPulses()));
        playPauseSound();
      }
      else
      {
        setMeasuringState();
        showMeasurementStatus(cowId, pulsesToLiters(getFlowPulses()));
        playResumeSound();
      }
    }

    if (buttonPressed(finishButton))
    {
      shouldFinish = true;
      continue;
    }

    if (millis() - lastStatusAt >= statusIntervalMs)
    {
      unsigned long pulses = getFlowPulses();
      unsigned long now = millis();
      unsigned long elapsed = now - lastFlowCalcAt;
      unsigned long deltaPulses = pulses - lastPulseSnapshot;
      float liters = pulsesToLiters(pulses);
      float flowLpm = 0.0;

      if (elapsed > 0)
      {
        flowLpm = pulsesToLiters(deltaPulses) * (60000.0 / elapsed);
      }

      lastPulseSnapshot = pulses;
      lastFlowCalcAt = now;
      lastStatusAt = now;

      Serial.println("Pulse=" + String(pulses) + " Miktar=" + String(liters, 2) + " L Debi=" + String(flowLpm, 2) + " L/dk");
      showMeasurementStatus(cowId, liters);

      if (!measurementPaused && liters > 0.0)
      {
        sendMeasurement(jobId, liters, false);
      }

      if (!measurementPaused &&
          liters > 0.0 &&
          now - lastLiveSendAt >= liveMeasurementIntervalMs &&
          (lastLiveSendAt == 0 || liters - lastLiveSentLiters >= minLiveMeasurementDeltaLiters))
      {
        lastLiveSendAt = now;
        lastLiveSentLiters = liters;

        String liveResponse = sendMeasurement(jobId, liters, false);
        if (liveResponse.length() > 0)
        {
          Serial.println("Canli olcum gonderildi: " + String(liters, 2) + " L");
        }
        else
        {
          Serial.println("Canli olcum gonderilemedi.");
        }
      }
    }

    if (!measurementPaused && millis() - lastMeasuringSoundAt >= measuringSoundIntervalMs)
    {
      lastMeasuringSoundAt = millis();
      playMeasuringTickSound();
    }

    delay(10);
    yield();
  }

  measurementActive = false;
  measurementPaused = false;

  float liters = pulsesToLiters(getFlowPulses());
  Serial.println("Olcum bitirildi. Toplam sut: " + String(liters, 2) + " L");

  if (liters <= 0.0)
  {
    showStatus("Olcum bos", "Kayit yok");
    playErrorSoundThrottled();
    blink(RED_LED, 3, 180);
    setIdleState();
    return;
  }

  setSendingState();
  showStatus("Sunucuya", String(liters, 2) + " L");
  String measurementResponse = sendMeasurement(jobId, liters, true);
  String measurementResponse = sendMeasurement(jobId, liters, true);

  if (measurementResponse.indexOf("Mobil onay bekleniyor") != -1 ||
      measurementResponse.indexOf("Olcum is emrine yazildi") != -1 ||
      measurementResponse.indexOf("\"status\":\"ready\"") != -1 ||
      measurementResponse.indexOf("\"status\":\"completed\"") != -1)
  {
    showStatus("Mobil onay", String(liters, 2) + " L");
    setSuccessState();
    playSuccessSound();
    delay(1200);
  }
  else
  {
    showStatus("Kayit hatasi", "API kontrol");
    playErrorSoundThrottled();
    blink(RED_LED, 4, 180);
  }

  setIdleState();
}

void connectToWiFi()
{
  Serial.println("WiFi baglaniyor...");
  showStatus("WiFi", "Baglaniyor");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    blink(YELLOW_LED, 1, 250);
    Serial.print(".");
    yield();
  }

  Serial.println("\nWiFi baglandi: " + WiFi.localIP().toString());
  showStatus("WiFi baglandi", WiFi.localIP().toString());
  playWiFiSound();
}

String sendOnlineStatus()
{
  String url = String(serverBase) + "/api/mobile/sensor/online";
  String body = "{\"sensorQr\":\"" + String(sensorQr) + "\"}";
  return postJson(url, body);
}

String queryActiveJob()
{
  String url = String(serverBase) + "/api/mobile/sensor/jobs/active?sensorQr=" + String(sensorQr);
  return getUrl(url);
}

String sendMeasurement(int jobId, float liters, bool finalMeasurement)
String sendMeasurement(int jobId, float liters, bool finalMeasurement)
{
  String url = String(serverBase) + "/api/mobile/sensor/measurements";
  String body = "{";
  body += "\"sensorQr\":\"" + String(sensorQr) + "\",";
  body += "\"jobId\":" + String(jobId) + ",";
  body += "\"liters\":" + String(liters, 2) + ",";
  body += "\"finalMeasurement\":";
  body += finalMeasurement ? "true" : "false";
  body += "\"liters\":" + String(liters, 2) + ",";
  body += "\"final\":" + String(finalMeasurement ? "true" : "false");
  body += "}";

  return postJson(url, body);
}

void resetFlowCounter()
{
  noInterrupts();
  flowPulseCount = 0;
  interrupts();
}

unsigned long getFlowPulses()
{
  noInterrupts();
  unsigned long pulses = flowPulseCount;
  interrupts();
  return pulses;
}

float pulsesToLiters(unsigned long pulses)
{
  return pulses / flowPulsesPerLiter;
}

String getUrl(String url)
{
  if (WiFi.status() != WL_CONNECTED)
  {
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

String postJson(String url, String body)
{
  if (WiFi.status() != WL_CONNECTED)
  {
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

int extractJsonInt(String json, String key)
{
  String token = "\"" + key + "\":";
  int start = json.indexOf(token);
  if (start == -1)
  {
    return 0;
  }

  start += token.length();
  int end = start;
  while (end < json.length() && isDigit(json[end]))
  {
    end++;
  }

  return json.substring(start, end).toInt();
}

String extractJsonString(String json, String key)
{
  String token = "\"" + key + "\":\"";
  int start = json.indexOf(token);
  if (start == -1)
  {
    return "";
  }

  start += token.length();
  int end = json.indexOf("\"", start);
  if (end == -1)
  {
    return "";
  }

  return json.substring(start, end);
}

bool buttonPressed(ButtonState &button)
{
  int reading = digitalRead(button.pin);

  if (reading != button.lastReading)
  {
    button.lastReading = reading;
    button.lastChangeAt = millis();
  }

  if ((millis() - button.lastChangeAt) > buttonDebounceMs && reading != button.stableState)
  {
    button.stableState = reading;
    if (button.stableState == LOW)
    {
      return true;
    }
  }

  return false;
}

void setLeds(bool red, bool yellow, bool green)
{
  digitalWrite(RED_LED, red ? HIGH : LOW);
  setYellowLed(yellow);
  digitalWrite(GREEN_LED, green ? HIGH : LOW);
}

void setYellowLed(bool on)
{
  yellowBlinkState = on;
  digitalWrite(YELLOW_LED, on ? HIGH : LOW);
}

void startYellowBlink()
{
  yellowBlinkState = true;
  lastYellowBlinkAt = millis();
  digitalWrite(YELLOW_LED, HIGH);
}

void updateYellowBlink()
{
  if (millis() - lastYellowBlinkAt < yellowBlinkIntervalMs)
  {
    return;
  }

  lastYellowBlinkAt = millis();
  yellowBlinkState = !yellowBlinkState;
  digitalWrite(YELLOW_LED, yellowBlinkState ? HIGH : LOW);
}

void setIdleState()
{
  setLeds(false, true, true);
}

void setMeasuringState()
{
  setLeds(false, true, false);
  startYellowBlink();
}

void setPausedState()
{
  setLeds(false, true, true);
  startYellowBlink();
}

void setSendingState()
{
  setLeds(false, true, false);
}

void setSuccessState()
{
  setLeds(false, false, true);
}

void blink(uint8_t pin, int count, int delayMs)
{
  for (int i = 0; i < count; i++)
  {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
    yield();
  }
}

void beep(int count, int delayMs)
{
  for (int i = 0; i < count; i++)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(delayMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(delayMs);
    yield();
  }
}

void playToneMs(unsigned int frequency, unsigned int durationMs)
{
#if BUZZER_USE_TONE
  tone(BUZZER_PIN, frequency, durationMs);
  delay(durationMs);
  noTone(BUZZER_PIN);
#else
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);
#endif
  delay(25);
  yield();
}

void playStartupMelody()
{
  playToneMs(659, 150);
  playToneMs(784, 150);
  playToneMs(988, 220);
  playToneMs(784, 120);
  playToneMs(1047, 260);
  playToneMs(988, 160);
  playToneMs(784, 160);
  playToneMs(659, 220);
  playToneMs(523, 180);
  playToneMs(659, 180);
  playToneMs(784, 220);
  playToneMs(988, 320);
  playToneMs(1175, 180);
  playToneMs(1319, 180);
  playToneMs(1568, 420);
  playToneMs(1319, 140);
  playToneMs(1568, 315);
}

void playWiFiSound()
{
  playToneMs(880, 70);
  playToneMs(1175, 90);
}

void playJobFoundSound()
{
  playToneMs(659, 60);
  playToneMs(784, 60);
  playToneMs(659, 80);
}

void playPauseSound()
{
  playToneMs(392, 150);
}

void playResumeSound()
{
  playToneMs(659, 70);
  playToneMs(880, 90);
}

void playMeasuringTickSound()
{
  playToneMs(1047, 35);
}

void playSuccessSound()
{
  playToneMs(988, 80);
  playToneMs(1175, 80);
  playToneMs(1319, 120);
}

void playErrorSound()
{
  playToneMs(220, 130);
  playToneMs(175, 170);
}

void playErrorSoundThrottled()
{
  unsigned long now = millis();
  if (lastErrorSoundAt != 0 && now - lastErrorSoundAt < errorSoundIntervalMs)
  {
    return;
  }

  lastErrorSoundAt = now;
  playErrorSound();
}

void showMeasurementStatus(const String &cowId, float liters)
{
  String topLine = cowId.length() > 0 ? cowId : "Inek bilgisi";
  String bottomLine = "Olculen:" + String(liters, 2) + "L";
  showStatus(topLine, bottomLine);
}

void showStatus(const String &line1, const String &line2)
{
  Serial.println("[LCD] " + line1 + " | " + line2);
#if USE_LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
#endif
}
