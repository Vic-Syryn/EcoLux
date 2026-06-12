# Bill of materials
begin define fase:
* karton
* magneettape
* ductape
* lijm
* papiertape

eind define fase:
* ledstrip
* touch screen scherm
* hout
* PLA
* Rasberry Pi
* Arduino Uno
* LDR lichtsensor
* smartplug
* smartswitch

# Assembly

## <ins/> Deel 1: Electronica
## Stap  1: Circuit bouwen
<ins/>Benodigdheden:

- Raspberry Pi (3B / 4) met Raspberry PI OS
- Arduino Uno
- LDR (lichtsensor)
- WS2812 LED strip (27 LEDs, 5V)
- 10kΩ weerstand (voor LDR voltage divider)
- 470Ω weerstand (op data-lijn LED strip)
- USB-A naar USB-B kabel (Pi naar Arduino)
- 5V voeding (minimaal 2A voor Pi + Arduino, strip apart of via Pi bij 27 LEDs)
- Jumper wires

Bouw het circuit volgens het onderstaande schema.

## Stap  2: Arduino sketch flashen
1. Open de Arduino IDE op je computer
2. Installeer de **Adafruit NeoPixel** library:
   - Sketch → Include Library → Manage Libraries
   - Zoek "Adafruit NeoPixel" → Install
3. Open `arduino_sketch.ino`
4. Pas indien nodig de kalibratie aan:
```cpp
   const int LDR_DARK   = 822;  // ADC waarde bij volledig afgedekte LDR
   const int LDR_BRIGHT = 972;  // ADC waarde bij directe lamp op LDR
```
5. Selecteer het juiste board: **Tools → Board → Arduino Uno**
6. Selecteer de juiste poort: **Tools → Port**
7. Klik **Upload**

## Stap 3: Raspberry pi
### 1:
SSH naar de Pi of open een terminal:
 
```bash
# Update het systeem
sudo apt update && sudo apt upgrade -y
 
# Installeer Python dependencies
pip3 install pyserial requests --break-system-packages
```
 
---
 
### 2:
 
Kopieer via WinSCP of `scp` de volgende bestanden naar `/home/ecolux/`:
 
| Bestand | Doel |
|---|---|
| `gpio_controller.py` | `/home/ecolux/gpio_controller.py` |
| `test_components.py` | `/home/ecolux/test_components.py` |
 
En naar `/home/ecolux/matter-api/`:
 
| Bestand | Doel |
|---|---|
| `main.py` | `/home/ecolux/matter-api/main.py` |
 
---
 
### 3: 
 
```bash
# Ga naar de matter-api map
cd /home/ecolux/matter-api
 
# Installeer dependencies in de virtual environment
/home/ecolux/matter-env/bin/pip install fastapi uvicorn websockets pydantic
 
# Test of de API werkt
/home/ecolux/matter-env/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```
 
Open in browser: `http://<pi-ip>:8000/health` — moet `{"status":"ok"}` tonen.
 
Stop de test server met `Ctrl+C`.
 
---
 
### 4:
 
#### Matter API service
 
```bash
sudo nano /etc/systemd/system/matter-api.service
```
 
Plak dit erin:
 
```ini
[Unit]
Description=EcoLux Matter API
After=network.target
 
[Service]
Type=simple
User=ecolux
WorkingDirectory=/home/ecolux/matter-api
ExecStart=/home/ecolux/matter-env/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
 
[Install]
WantedBy=multi-user.target
```
 
#### GPIO Controller service
 
```bash
sudo nano /etc/systemd/system/ecolux-gpio.service
```
 
Plak dit erin:
 
```ini
[Unit]
Description=EcoLux GPIO / Arduino Controller
After=network.target
 
[Service]
Type=simple
User=ecolux
WorkingDirectory=/home/ecolux
ExecStart=/usr/bin/python3 /home/ecolux/gpio_controller.py
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
 
[Install]
WantedBy=multi-user.target
```
 
#### Beide services activeren
 
```bash
sudo systemctl daemon-reload
sudo systemctl enable matter-api
sudo systemctl enable ecolux-gpio
sudo systemctl start matter-api
sudo systemctl start ecolux-gpio
```
 
---
## <ins/> Deel 2: behuizing
## Stap  1: Onderdelen printen
Print de onderdelen van de plantenpot. Wegens de omvang en vorm van het hoofdframe, wordt het aangeraden om dit op te splitsen in 4 delen. Naast het hoofdframe moeten er ook 3 poojes en 1 onderkant geprint worden.

<p align="center">
  <img src="../img/Ecolux print overview.png" width="100%">
  Print overview
<p align="center">

## Stap 2: Delen hoofdframe aan elkaar lijmen
Lijm de 4 delen van het frame aan elkaar. Secondelijm wordt hier voor aangeraden.
<p align="center">
  <img src="../img/Lijmen.png" width="100%">
  Lijmen
<p align="center">

## Stap 3: Led strip en LDR bevestigen
Bevestig de led strip in de voorziene groef en steek de LDR in in het voorziene gat.
<p align="center">
  <img src="../img/Ledstrip-bevestigen.png" width="100%">
  Bevestigen ledstrip
<p align="center">

### Stap 4: Pootjes en elektronica
Bevestig de pootjes op het hoofdframe, leg de elektronica op de onderkant, met de stroomkabels door het gat. Zorg er vervolgens voor dat de onderkant op de goede plaats zit en verdraai de pootjes zodat de onderkant vast zit aan het hoofdframe.