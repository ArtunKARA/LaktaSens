### Proje İçin Öneri Dosyası



Proje içindeki çözmeyi planladığım ana problem bir ineğin önümüzdeki belirli bir ufukta sürüden çıkarılma riskini ve ekonomik değerini tahmin edip, elde tut / yakın takip / çıkarma adayı şeklinde karar desteği üretmek. Bu sayede ilgili ineğin sürü içerisinde tutulup tutulmayacağı alınacak aksiyona destek sağlanmasını planlıyorum. Gerçek çiftlik aksiyon loglarından doğrudan öğrenen RL yapacak kadar veri bulamadım o yüzden dış veriden öğrenilmiş stokastik bir çiftlik simülatörü üzerinde RL eğitimi daha mantıklı.



#### Hangi çevreyi kullanacaksın?

Özel yazılmış bir Gymnasium ortamı kullanmayı planlıyorum buradaki ortamda doğrudan gerçek çiftlikten canlı veri alan bir ortam yerine tarihsel veriden öğrenilmiş stokastik bir simülasyon ortamı kurmayı planlıyorum. Yani gerçek çiflik verileri üstünde değil öğrenilmiş geçişler üstünde çalılışan MDP tabanlı RL ortamı kurumak çünkü literatür içinde replacement/culling problemi durum-geçişli karar problemi olarak ele alınmış.



Çevrenin yapısı:

* ajan: inek bazlı karar verici
* zaman adımı: 1 ay
* epizod: doğumdan sürüden çıkarılmaya ya da gözlem ufkunun sonuna kadar



Şeklinde bir ortam planlıyorum.



#### State (s), Action (a), Reward (r), Probability (P)

##### State (s)

tate, ineğin o andaki üretim, üreme ve sağlık durumunu temsil edecek bunun ile ilgili olaratan ilk olarak bulduğum ve bilreştirebileceğim veri setleri ile aşağıdaki değikenleri kullanmayı planlıyorum:

* laktasyon numarası
* DIM yani doğumdan beri geçen gün
* gebelik durumu
* tohumlama sayısı
* son tohumlamadan beri geçen süre
* son 30 gün ortalama süt verimi
* süt trendi
* son dönemdeki sağlık olayı sayısı
* yaş / parite

Bu beriler ile seçimin sağlık, üreme ve üretim durumlarının zaman içindeki değişimine bağlı bir şekilde verilmesini hedefliyorum.



##### Action (a)

İlk faz için elimizdeki verinin de doğrultusunda iki eyelem uzayında düşürüdüm(normalde 3 ile başlarım demiştim ama yakın takip vs için yeterli veri bulamadım)



0 = elde tut (keep)

1 = sürüden çıkar (cull)



Bu problem kategorik bir karar problemi ondan temel olarak iki ayrık uzayda değerlendirdim sonucu



##### Reward (r)

* keep aksiyonunda: süt geliri − bakım maliyeti − sağlık/üreme riski cezası
* cull aksiyonunda: hurda/satış değeri − replacement maliyeti

Burdaki amacum ajanın kısa vadeli bi süt verimi değil de uzun vadede ekonomik değeri optimize etmeye çalışmasını sağlamak bu replacement kısmı ekonamik olarak incelenmiş genel olaratan ki banada en mantıklısı o geldi.



##### Probability (P)

Bir durumdan sonraki duruma geçiş olasılığı, dış veriden öğrenilmiş stokastik geçiş modeli ile tanımlanacak :

* keep seçildiğinde: inek bir sonraki ay farklı süt, üreme veya sağlık durumlarına geçebilir
* cull seçildiğinde: ise süreç terminal duruma gider.

Bu yüzen geçişler olasılıksal olucak sabit değil. 





#### Model-free mi, model-based mi? Neden?



Bu projede model-based yaklaşım ile ilerlemeye kara verdim elimzdeki tarihsel veri ile gerçek ortamda veri toplayamadığımız için yeni veri toplayamayacağız model based yaklaşım ile çevrenin geçiş dinamiklerini veriden tahmin ederek sonra bu çevre üzerinde politika öğretmeye çalışıcağız Model-based RL’nin daha az etkileşim verisiyle güçlü sonuçlar verebildiği PETS gibi çalışmalarla da gösterilmiş durumda.



Model-free yöntemler bu fazla zor imkansız bu şekilde bir bi ortam yok özellikle offline/sabit veri ortamında standart off-policy yöntemlerin dağılım dışı aksiyonlar nedeniyle bozulabildiği, CQL ve BCQ gibi offline RL yöntemlerinin ise tam bu sorunu hedeflediği için bu taz bi yaklaşım alınabilir ama zor.



##### Deterministik mi, stokastik mi? Neden stokastik seçiyoruz?



Bu problem kısaca stokastik bir problemdir çünkü aynı üretim ve üreme durumuna sahip görünen iki inek, sonraki ay aynı süt verimini, aynı sağlık sonucunu veya aynı culling sonucunu üretmeyebilir sonuçta bunlar bilmediğimiz bir dış etkinin sonucunda farklı bir sonuç üretmiş olabilir bunundan dolayı bizim buradaki problemimiz stokastik bir problemdir.Bu yüzden tek bir sabit geçiş varsayımı yapmak yerine olasılıksal geçiş kullanmak daha mantıklıdır öbür türlü mükemmel bi düzene ihtiyacımız var.



Stokastik model seçmemizin nedeni, gerçek çiftlik kararlarının belirsizlik altında verilmesi gerikiyor ve RL ajanının da beklenen uzun vadeli getiriyi optimize etmesinin isteyerek buradaki sistemi kurguladım deterministik model bu belirsizliği gizler ve problemi gereğinden fazla basitleştirir ki bu sonuçta da belirsizlik ile baş edemeyiz 





##### Eylem uzayı ayrık mı sürekli mi?



Bu Projede ayrık eylem uzayı geekli bu kara dooğal olaraktan sınıflı bir yönetim yaptığımız için verilen bi karadır keep veya cull şeklinde durumda karar alıncaktır. Bir robot kol vs gibi sürekli kontrol problemi değildir. Bu yüzden sürekli yöntemler ilk tercihimiz olmuyor DDPG mesela sürekli kontrol algosu olmaz.



##### Hangi yöntemi kullanmayı planlıyorsun?



İlk olaraktan model-based, stokastik,discredte-time MDP çömünü kullanmayı planlıyorum Önce geçiş olasılıklarını veriden öğrenip sonra policy iteration ile veya value iteration ile optima politakayı çıkarıcağız. Bu yaklaşım hem RL mantığını koruyor hemde mevcut veri gerçekliğiyle uyumlu kalıyor. Bizim bu yöntemimizin literitürde bir temeli de bulunmakta.





İkinci fazda ise bir karşılaştırma deneyi olarak offline RL, özellikle CQL, değerlendirilebilir. Çünkü CQL sabit tarihsel veriden, ek etkileşim olmadan politika öğrenmek için tasarlanmış bir yöntemdir.Tabi bu faz ne zaman olur orasını Allah bilir canlıya geçip gerçek verileri sisteme basmak gerekmekte bu iş için.



##### Hangi yöntemleri araştırıp seçiminizi yaptınız?



Bu problem için PPO,A3C,DDPG ve TD3 gibi RL yöntemleri sabit arihsel veriyle ilerlemesi ve karar uzatının ilk sürümde bunu yapamıyoruz PPO ve A3C esas olarak ortamla etkileşim krarak veri toplayan online yöntemtemler ki bizim öyle bir ortamımız yok DDPG ve TD3 ise continuous action problemler için ama bizim eylem uzayımız ise kesikşli o yüzden bu kısmı da eledik.



DQN olabilir bizim problemimiz aksiyon pasında kağıt üstünde uygundur ancak DQN de temel haliyle çevreyle etkileşim içinde öğrenen ve çevrim içi veri toplamadan fayda gören bir yaklaşımdır bizim ilk fazda bu çflik yok ama Allah nasip ederde piyasa koşullarına gidbilir isek bu net yapılır bi aksiyon olur.



SAC yöntemi de olabilir off-policy ve örnek verimlliği yüksek bir yöntem ayrıca krarlı öğrenme özellikleriyle biliniyor ancak özgün hali esas olarak sürekli eylem uzayında çalışmak üzere tasarlanmış bir uygulamadır o yüzden SAC varyantları olsada başlagıç fazında probelememizi gerehinde fazla karmaşık hale getiriyordu.



**Beneim bu süreçte ilk deneyeceğim yöntem** 



problem:

* uzun vadeli karar problemi
* belirsizlik içeriyor
* aksiyon uzayı ayrık
* veri başlangıçta sabit ve tarihsel
* açıklanabilir ve savunulabilir çözüm gerektiriyor

Bu sebeplerden dolyı en uygun seçim **stokastik ve model-based bir MDP/RL** bir çözğm geliştirmek gerekiyor diğer yöntemler teorik olarak güçlü ama bizim problem tamı için şu an zayıf kalıyor Allah nasip eder ise ileride diğer çözüm yöntemleri ile de gerçek verileri elde ettikten sonra piyasaya açıldıktan sonra denerim.





