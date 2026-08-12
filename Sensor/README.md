# Sensör yapılandırması

Sensör yazılımlarındaki Wi-Fi bilgileri Git deposunda tutulmaz. Derlemeden önce
kullanacağınız sensör klasöründeki örnek dosyayı aynı klasörde
`arduino_secrets.h` adıyla kopyalayın:

```bash
cp arduino_secrets.example.h arduino_secrets.h
```

Ardından `arduino_secrets.h` içindeki `SECRET_SSID` ve `SECRET_PASSWORD`
değerlerini kendi ağınıza göre düzenleyin. Bu dosya kök `.gitignore` tarafından
izleme dışında bırakılır; örnek dosyalara gerçek parola yazmayın.

Her sensör ayrı bir Arduino taslağı olduğundan bu işlem kullanılan her sensör
klasörü için tekrarlanmalıdır. Sunucu adresi, sensör kimliği ve donanım pinleri
de yükleme öncesinde ilgili `.ino` dosyasından geliştirme ortamına göre kontrol
edilmelidir.

