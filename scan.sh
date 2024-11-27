#!/bin/bash


ip_address=$(ifconfig | grep -Eo 'inet 192\.[0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}')

if [ -n "$ip_address" ]; then
    echo "Adresse IP : $ip_address"
    formatted_ip="${ip_address%.*}.0/24"
    echo "Adresse du reseau : $formatted_ip"
    #nmap -sn $formatted_ip

    scanned_ips=($(nmap -sn $formatted_ip -oG - | awk '/Up$/{print $2}'))

    # Affiche les adresses IP scannées
    echo "Adresses IP scannées :"
    for ip in "${scanned_ips[@]}"; do
        echo "$ip"
    done

else
    echo "Aucune adresse IP commençant par 192 n'a été trouvée."
fi
