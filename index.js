const express = require("express")

const { execSync, exec } = require('child_process')
const { CronJob } = require('cron')
const axios = require('axios');
const { AES, enc } = require('crypto-js');
const fs = require('fs')

const app = express()

const secretKey = 'TWqA2xvjRUH7yQhYCs8XuZEkgMdznLm5';

app.listen(4444, async () => {

    let currentIpClient = await getIpClient2()
    console.log("ip_client", currentIpClient)

    let ip_serveur

    let scanlist = await getListIpReseau(currentIpClient)

    if (scanlist.length > 0) {
        ip_serveur = await getIpServeur(scanlist)
        console.log(`L'ip du serveur est: ${ip_serveur}`);

        if (ip_serveur) {
            updateIp2(ip_serveur)
            launchScreen()
        }
    }

    const job = new CronJob(
        '*/3 * * * *',
        async function () {
            let newIp = await getIpClient2()
            console.log('Vous verrez ce message toutes les 3 minutes');
            if (currentIpClient !== newIp || ip_serveur === null || ip_serveur === undefined) {
                console.log('Adresse IP actuelle :', newIp)
                currentIpClient = newIp;

                if (currentIpClient !== null) {
                    let scanlist = await getListIpReseau(currentIpClient)

                    if (scanlist.length > 0) {
                        ip_serveur = await getIpServeur(scanlist)
                        console.log(`L'ip du serveur est: ${ip_serveur}`);

                        if (ip_serveur) {
                            updateIp2(ip_serveur)
                            launchScreen()
                        }
                    }
                }

            }
        },
        null,
        true,
        'Africa/Abidjan'
    );

});


function encrypt(params) {
    return AES.encrypt(params, secretKey).toString();
}


async function getIpClient2() {

    try {
        return new Promise((resolve, reject) => {
            exec(`ifconfig`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erreur : ${error}`);
                    return reject(error);
                }

                if (stderr) {
                    console.error(`Erreur standard : ${stderr}`);
                    return reject(new Error(stderr));
                }

                if (stdout) {
                    // Utilisation de la commande awk pour extraire les adresses IP commençant par "192"
                    const matches = stdout.match(/inet (192\.[0-9]+\.[0-9]+\.[0-9]+)/g);

                    if (matches) {
                        const ipAddresses = matches.map(match => match.split(' ')[1]);
                        
                        // Filtrer les adresses IP commençant par "192.168.53"
                        const filteredIpAddresses = ipAddresses.filter(ip => !ip.startsWith('192.168.53'));
                        
                        resolve(filteredIpAddresses[0]);
                    } else {
                        resolve([]);
                    }
                }
            });
        });
    } catch (error) {
        console.log("error", error);
    }
}


async function getIpServeur(listIp) {
    let serveur
    let data

    //Le fichier contenant l'id de la box (fichier unique pour chaque différente box)
    if (fs.existsSync('/home/dronehive/Documents/checkReseau/idHive.conf')) {
        data = fs.readFileSync('/home/dronehive/Documents/checkReseau/idHive.conf', 'utf8')
        data = data.split("idInDb ")[1]
    } else {
        data = null
    }

    console.log("data", data);

    for (let i = 0; i < listIp.length; i++) {
        const element = listIp[i];

        const postData = {
            message: encrypt('TLHa^n9@2+-DR~`/EtAC3w8cP:vpd;}!uz=5U4x&kj7M.('),
            id: data
        };

        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const params = new URLSearchParams(postData);

        try {
            const response = await axios(`http://${element}:4400?${params}`, options);

            console.log("response, response", response.data);
            if (response.status === 200) {
                if (response.data) {
                    const body = await response.data;
                    serveur = element

                    return serveur
                }
                else {
                    console.log(`${element} n'est pas la bonne machine`);
                }

            } else {
                console.log(`La requête pour ${element} a renvoyé un statut ${response.status}`);
            }
        } catch (error) {
            console.error(`Problème avec la requête pour ${element} : ${error}`);
        }
    }

    return null
}

async function getListIpReseau(ip) {
    // let ip = (await execSync("ifconfig | grep -Eo 'inet 192\.[0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}'")).toString()

    let scanlist = []

    if (ip && ip.length ) {
        console.log("hello", ip);

        let formatted_ip = ip.split('.').slice(0, 3).join('.') + '.0/24'

        console.log("Adresse IP formatée : " + formatted_ip);

        let scan = await execSync(`nmap -sn ${formatted_ip} -oG - | awk '/Up$/{print $2}'`).toString()

        scanlist = scan.split('\n')
        scanlist.pop()
        scanlist.shift()


        console.log("scan: ", scanlist);


        return scanlist

    }

    else return []
}


function updateIp2(ip_serveur) {

    console.log("ip_serveur", ip_serveur);

    //Modification de l'ip dans le fichier de configuration de BootChecker

    let check_file = "/home/dronehive/hive/dev/SOTH/BootChecker/check.conf"

    execSync(`sed -i 's/serverHost [0-9]\\+\\.[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+/serverHost ${ip_serveur}/' ${check_file}`);
    console.log('Substitution réussie.');

}

function launchScreen() {
    //Relancer le screen de BootChecker
    exec('/home/dronehive/Documents/checkReseau/reloadBc.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script: ${error}`);

            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}