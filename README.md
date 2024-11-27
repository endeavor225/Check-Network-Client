# Check Reseau (BOX)

Dans le dossier où se trouve l'application compilée sur la box, créer un fichier idHive.conf 

## Commande pour compiler le code
```bash
pkg -t node16-linux-x64 -o checkReseau --public index.js
```

## idHive.conf 
À configurer avec id de la box
```bash
idInDb 46
```

## execCheckReseau.sh
```bash
#!/bin/bash

export PATH="/sbin:$PATH"

cd /home/dronehive/Documents/checkReseau
screen -S checkReseau -d -m -L
screen -S checkReseau -X exec ./checkReseau
```


## reloadBc.sh
```bash
#!/bin/sh

cd /home/dronehive/hive/dev/SOTH/BootChecker/
screen -S bc -X quit
screen -S bc -d -m -L
screen -S bc -X exec ./bootChecker
```
sudo chmod +x /home/dronehive/Documents/checkReseau/reloadBc.sh


### Configuration de cron
export VISUAL=nano; crontab -e
```bash
@reboot sleep 30 && /home/dronehive/Documents/checkReseau/execCheckReseau.sh
```

