#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define MILK_SENSOR_PIN A0
#define GREEN_LED D2
#define RED_LED D3

const char *ssid = "Penguen";
const char *password = "P20202020";

// Mobil API ile ayni sunucu. Fiziksel testte bilgisayarin LAN IP adresini yaz.
const char *serverBase = "http://192.168.1.10:3030";
const char *sensorQr = "f2dw2iGzdQXgT0cp";

const unsigned long pollIntervalMs = 3000;
unsigned long lastPollAt = 0;

void setup()
{
  Serial.begin(115200);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  connectToWiFi();
  sendOnlineStatus();
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    connectToWiFi();
  }

  if (millis() - lastPollAt < pollIntervalMs)
  {
    delay(100);
    return;
  }

  lastPollAt = millis();
  String activeJobResponse = queryActiveJob();

  if (activeJobResponse.indexOf("\"hasJob\":true") == -1)
  {
    blink(GREEN_LED, 1, 120);
    return;
  }

  int jobId = extractJsonInt(activeJobResponse, "id");
  String cowId = extractJsonString(activeJobResponse, "cowId");

  if (jobId <= 0)
  {
    Serial.println("Is emri ID okunamadi.");
    blink(RED_LED, 2, 180);
    return;
  }

  Serial.println("Acik is emri bulundu: #" + String(jobId) + " inek=" + cowId);
  float liters = readMilkLiters();
  float temperature = readTemperature();
  String measurementResponse = sendMeasurement(jobId, liters, temperature);

  if (measurementResponse.indexOf("Olcum kaydedildi") != -1 || measurementResponse.indexOf("\"status\":\"completed\"") != -1)
  {
    digitalWrite(GREEN_LED, HIGH);
    delay(800);
    digitalWrite(GREEN_LED, LOW);
  }
  else
  {
    blink(RED_LED, 3, 180);
  }
}

void connectToWiFi()
{
  Serial.println("WiFi baglaniyor...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    blink(GREEN_LED, 1, 250);
    Serial.print(".");
  }

  Serial.println("\nWiFi baglandi: " + WiFi.localIP().toString());
  digitalWrite(GREEN_LED, HIGH);
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

String sendMeasurement(int jobId, float liters, float temperature)
{
  String url = String(serverBase) + "/api/mobile/sensor/measurements";
  String body = "{";
  body += "\"sensorQr\":\"" + String(sensorQr) + "\",";
  body += "\"jobId\":" + String(jobId) + ",";
  body += "\"liters\":" + String(liters, 2) + ",";
  body += "\"temperature\":" + String(temperature, 1);
  body += "}";

  return postJson(url, body);
}

float readMilkLiters()
{
  int raw = analogRead(MILK_SENSOR_PIN);

  // Kalibrasyon sahada degistirilmeli: 0-1023 analog degeri 0-35 L araligina maplenir.
  float liters = (raw / 1023.0) * 35.0;
  Serial.println("Sut miktari: " + String(liters, 2) + " L");
  return liters;
}

float readTemperature()
{
  int raw = analogRead(MILK_SENSOR_PIN);
  float voltage = raw * (3.3 / 1023.0);
  float temperature = voltage * 100.0;
  Serial.println("Sicaklik sinyali: " + String(temperature, 1) + " C");
  return temperature;
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

void blink(int pin, int count, int delayMs)
{
  for (int i = 0; i < count; i++)
  {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
  }
}
