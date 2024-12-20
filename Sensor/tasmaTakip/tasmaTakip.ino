#define sensorPin A0

void setup() {
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // LED kontrolü
  digitalWrite(12, HIGH);
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(12, LOW);
  digitalWrite(13, LOW);
  delay(1000);

  // Sıcaklık okuma
  int reading = analogRead(sensorPin);
  float voltage = reading * (3.3 / 1024.0);
  float temperatureC = voltage * 100.0;

  Serial.print("Temperature: ");
  Serial.print(temperatureC);
  Serial.println("°C");

  delay(1000);
}