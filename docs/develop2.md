## Develop 2

Door de conclusies uit Develop 1 was er voldoende informatie om het design van het hoofdstation verder te bepalen en te valideren. Uit Develop 1 bleek onder andere dat het scherm niet instelbaar moest zijn. Voor develop 2 werd er aan het design gewerkt, de 11 beste schetsen werden opgenomen in een [Scorematrix (Develop 2)](https://github.com/Vic-Syryn/EcoLux/blob/main/onderzoek/Scorematrix_Develop_2.pdf). Hieruit werden de 4 meest belovende vormen geselecteerd op vlak van esthetiek, schermintegratie, haalbaarheid en potentieel gebruiksgemak. Op deze vormen werden de usability goals verder bepaald.

### <ins>**Usability goals**</ins>

Ergonomie: de gemiddelde man/vrouw moet het product kunnen gebruiken met minimale ergonomische belasting. (Siemens Jack)

Cognitieve & sensoriele ergonomie: Gebruikers (18–65 jaar) kunnen kerntaken in de app (bv. navigeren, informatie lezen en acties uitvoeren) binnen 30 seconden voltooien, met maximaal 1 fout per taak en een subjectieve leesbaarheidsscore van ≥ 4/5.

### <ins>Theoretische antropometrie</ins>

Om de ideale kijkhoek voor het scherm te bepalen vóór de fysieke prototypefase, werd een ergonomische simulatie uitgevoerd in Siemens Jack [(analyse)](https://github.com/Vic-Syryn/EcoLux/blob/main/onderzoek/Ergonomie%20scherm%20Siemens%20Jack.pdf). Hierbij werd een digitaal mensmodel gebruikt op basis van antropometrische data. De 'design for the mean'-methode werd toegepast met het 50e percentiel.

Als referentiehoogte werd eerst de eettafelhoogte onderzocht. De gemiddelde eettafelhoogte is 74 cm. Uit de simulatie bleek dat deze hoogte onvoldoende is voor comfortabel gebruik, ongeacht de kijkhoek. Daarom werd overgestapt naar dressoirhoogte, ongeveer 90 cm. Dit biedt een ergonomisch betere uitgangspositie.

<p align="center">
  <img src="../img/SiemensJackMan.png" width="30%">
  <img src="../img/SiemensJackVrouw.png" width="31.52%">
</p>
<p align="center">
simulatie gebruik gem man en vrouw </p>

<p align="center">
  <img src="../img/SiemensJackBelasting.png" width="70%">
</p>
<p align="center">
Simulatie belasting</p>

<p align="center">
  <img src="../img/SiemensJackGezichtsveld.png" width="70%">
</p>
<p align="center">
POV gebruiker</p>

Uit de analyse bleek een schermhoek van 23° optimaal. Bij deze hoek is de belasting op nek en rug minimaal, terwijl het scherm goed leesbaar blijft.

### <ins>**Cognitieve & sensoriele ergonomie**</ins>

Om met EcoLux te interageren, moest er een digitale interface gemaakt worden. Op basis van de interface uit de tweede wave van de definitionfase werd een verbeterde interface gemaakt met Figma make. Om te voldoen aan de tweede usability goal werd de interface ontworpen met de Gestaltwetten in het achterhoofd. De interface werd zo simpel mogelijk gehouden om cognitieve belasting te minimaliseren. Extra optimalisaties waren liftknoppen als metafoor om de juiste verdieping te kiezen en icoontjes als signifiers voor energieverliezende apparaten.

<p align="center">
  <img src="../img/Interface_Gif.gif" width="100%">
</p>
<p align="center">
app interface</p>

### <ins>**Build & test**</ins>

**Doelstellingen**

De gebruikerstesten onderzochten welke vorm als het meest esthetisch en praktisch werd ervaren. Daarnaast werden meerdere schermgroottes getest die modulair op de vormen pasten. Op het scherm stond een demoversie van de interface. Ook werd nagegaan of de hoek uit 'Ergonomie scherm – Siemens Jack' in de realiteit aangenaam was.

**Prototypes**

Met de 4 hoofdvormen, de ideale schermhoek en een interactieve interface werden prototypes gemaakt. Omdat schetsen geen duidelijk beeld geven van omvang en interactie, werden de 4 schetsen in Blender nagemaakt via subdivision-modeling. Op basis van deze 3D-modellen werden telkens 3 aanzichten gegenereerd en op ware grootte afgedrukt. Deze werden op polystyreen schuimblokken aangebracht, waaruit de vormen gesneden werden. Zo konden respondenten de omvang inschatten en de vormen vastnemen.

Ook de schermgrootte was belangrijk. Daarom werden 4 schermgroottes afgedrukt met een screenshot van de interface. Deze konden modulair per vorm gewisseld worden, waardoor er 16 mogelijke combinaties waren.

<p align="center">
  <img src="../img/prototypes op een rij, in context.jpg" width="80%">
</p>
<p align="center">
fysieke prototypes</p>

Een bijkomend voordeel van de 3D-modellen was dat ze op 7 manieren gerenderd konden worden. Zo kregen respondenten een beeld van hoe het product er later kon uitzien.

<p align="center">
  <img src="../img/Bloempot_renders.jpg" width="70%">
</p>
<p align="center">
render prototypes
</p>

**Materialen**

Voor de gebruikerstesten werden verschillende materialen gebruikt:

* Hoofdstationprototypes 

* Render

* Schermgrootte prototypes

* Smartphone voor interface demo 

* Valse plant 

* Smartphone voor opnames/foto's 

* Informed consent 

**Methoden**

De gebruikerstesten werden uitgevoerd bij de respondenten thuis om het product in een realistische context te evalueren. In totaal namen vijf deelnemers deel met verschillende profielen en niveaus van technologische ervaring.

Tijdens de testen gingen deelnemers in interactie met de prototypes. Vorm, schermgrootte en interface werden beoordeeld. De prototypes werden in de leefomgeving geplaatst, zodat het gebruik natuurlijk kon worden geobserveerd.

Via het Think Aloud Protocol (TAP) en Question Asking Protocol (QAP) werden handelingen, voorkeuren en problemen in kaart gebracht. Deze inzichten vormden de basis voor verdere ontwerpbeslissingen.

<p align="center">
  <img src="../img/scherm interactie.jpg" width="70%">
</p>
<p align="center">
interactie gebruikerstest</p>

**Resultaten**

Uit de testen kwamen inzichten naar voren over vormgeving, schermgrootte en interface. Vormgeving bleek belangrijk voor hoe het product in het interieur wordt ervaren. Gebruikers gaven de voorkeur aan een compacte en elegante vorm. Vooral vorm 2 werd als aantrekkelijk, zacht en passend ervaren. Grotere vormen voelden lomp of dominant aan.

De schermgrootte had veel invloed op gebruiksgemak. Te kleine schermen maakten icoontjes moeilijk zichtbaar en zorgden voor fouten. Te grote schermen werden overdreven en storend gevonden. Gebruikers verkozen daarom een gebalanceerde schermgrootte die leesbaar is, zonder het compacte karakter te verliezen.

De interface werd algemeen als duidelijk en overzichtelijk ervaren. De plattegrond en apparatenlijst werden nuttig gevonden. Toch waren icoontjes niet altijd meteen duidelijk. Extra labels of een legende kunnen helpen. Ook mag de interface visueel aantrekkelijker worden, bijvoorbeeld met kleurcodering per ruimte en een zachtere vormgeving.

Efficiëntie en gebruiksgemak staan centraal. Gebruikers verwachten snelle en logische handelingen, zoals alle apparaten in een ruimte tegelijk selecteren. Ze verkiezen een systeem waarbij ze kiezen wat uitgeschakeld moet worden, in plaats van wat genegeerd moet worden. Extra informatie, zoals energieverbruik en periodieke overzichten, kan betrokkenheid verhogen.

### <ins>kostenberekeing</ins>
Er werd een kostenberekening gedaan om de effectiviteit van de energiebesparing te bepalen.
Op basis van een realistisch referentiescenario wordt ruw geschat dat EcoLux €100 per jaar kan besparen, afhankelijk van het aantal gekoppelde toestellen, de instellingen, energieprijzen en het gedrag van het huishouden. Zie [kostenberekening](https://github.com/Vic-Syryn/EcoLux/blob/main/onderzoek/kostenberekening%20ecolux.pdf)

### <ins>Conclusies en implicaties</ins>

De gebruikerstesten beantwoorden de centrale onderzoeksvragen. Voor het hoofdstation kwam vorm 2 het sterkst naar voren. Gebruikers willen een compacte en elegante vorm die in het interieur past. Het product mag aanwezig zijn, maar mag de ruimte niet domineren.

Voor schermgrootte en ergonomie verkiezen gebruikers een middelgroot scherm. Dit moet goed leesbaar zijn zonder te groot te worden. Kleine schermen zorgen voor fouten en frustratie, terwijl grote schermen overdreven aanvoelen. De schermhoek van 23° uit de Siemens Jack-simulatie werd tijdens de gebruikerstesten als aangenaam ervaren.

Voor de interface bleek dat de basis duidelijk is, maar verdere verfijning nodig blijft. Icoontjes moeten duidelijker zijn en extra uitleg kan helpen via labels of een legende. Ook kan de interface aantrekkelijker worden met kleurgebruik en een zachtere vormgeving. Gebruikers verwachten snelle interacties.

Op basis van deze inzichten wordt EcoLux verder ontwikkeld als een product dat eenvoudig in gebruik is, goed past in het interieur en logisch werkt.