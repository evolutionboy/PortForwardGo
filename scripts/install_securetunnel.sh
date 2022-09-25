#!/bin/sh
clear
Font_Black="\033[30m"
Font_Red="\033[31m"
Font_Green="\033[32m"
Font_Yellow="\033[33m"
Font_Blue="\033[34m"
Font_Purple="\033[35m"
Font_SkyBlue="\033[36m"
Font_White="\033[37m"
Font_Suffix="\033[0m"

echo -e "${Font_SkyBlue}SecureTunnel installation script${Font_Suffix}"

while [ $# -gt 0 ]; do
    case $1 in
    --api)
        api=$2
        shift
        ;;
    --id)
        id=$2
        shift
        ;;
    --secret)
        secret=$2
        shift
        ;;

    *)
        echo -e "${Font_Red} Unknown param: $1 ${Font_Suffix}"
        exit
        ;;
    esac
    shift
done

if [ -z "${api}" ]; then
    echo -e "${Font_Red}param 'api' not found${Font_Suffix}"
    exit 1
fi

if [ -z "${id}" ]; then
    echo -e "${Font_Red}param 'id' not found${Font_Suffix}"
    exit 1
fi

if [ -z "${secret}" ]; then
    echo -e "${Font_Red}param 'secret' not found${Font_Suffix}"
    exit 1
fi

echo -e "${Font_Yellow} ** Checking system info...${Font_Suffix}"
case $(uname -m) in
x86)
    arch="386"
    ;;
i386)
    arch="386"
    ;;
x86_64)
    cpu_flags=$(cat /proc/cpuinfo | grep flags | head -n 1 | awk -F ':' '{print $2}')
    if [[ ${cpu_flags} == *avx512* ]]; then
        arch="amd64v4"
    elif [[ ${cpu_flags} == *avx2* ]]; then
        arch="amd64v3"
    elif [[ ${cpu_flags} == *sse3* ]]; then
        arch="amd64v2"
    else
        arch="amd64v1"
    fi
    ;;
armv7*)
    arch="armv7"
    ;;
aarch64)
    arch="arm64"
    ;;
s390x)
    arch="s390x"
    ;;
*)
    echo -e "${Font_Red}Unsupport architecture${Font_Suffix}"
    exit 1
    ;;
esac

if [[ ! -e "/usr/bin/systemctl" ]] && [[ ! -e "/bin/systemctl" ]]; then
    echo -e "${Font_Red}Not found systemd${Font_Suffix}"
    exit 1
fi

dir="/opt/SecureTunnel"
until [ -d "${dir}" ]; do
    read -p "${dir} is exists, please input a new dir: " dir
done
mkdir -p ${dir}

service_name="SecureTunnel"
until [ -f "/etc/systemd/system/${service_name}.service" ]; do
    read -p "Service ${service_name} is exists, please input a new service name: " service_name
done

echo -e "${Font_Yellow} ** Checking release info...${Font_Suffix}"
vers=$(curl -sL https://gitlab.com/api/v4/projects/CoiaPrant%2FPortForwardGo/releases | grep "tag_name" | head -n 1 | awk -F ":" '{print $2}' | awk -F "," '{print $1}' | sed 's/\"//g;s/,//g;s/ //g' | awk -F "v" '{print $2}')
if [ -z "${vers}"]; then
    echo -e "${Font_Red}Unable to get releases info${Font_Suffix}"
    exit 1
fi
echo -e " Detected lastet version: " ${vers}

echo -e "${Font_Yellow} ** Download release info...${Font_Suffix}"

curl -L -o /tmp/SecureTunnel.tar.gz "https://gitlab.com/CoiaPrant/PortForwardGo/-/releases/v"${vers}"/downloads/SecureTunnel_"${vers}"_linux_"${arch}".tar.gz"
if [ ! -f "/tmp/SecureTunnel.tar.gz" ]; then
    echo -e "${Font_Red}Download failed${Font_Suffix}"
    exit 1
fi

tar -xvzf /tmp/SecureTunnel.tar.gz -C /tmp/
if [ ! -f "/tmp/SecureTunnel" ]; then
    echo -e "${Font_Red}Decompression failed${Font_Suffix}"
    exit 1
fi

if [ ! -f "/tmp/systemd/SecureTunnel.service" ]; then
    echo -e "${Font_Red}Decompression failed${Font_Suffix}"
    exit 1
fi

chmod 777 /tmp/SecureTunnel
mv /tmp/SecureTunnel ${dir}

mv /tmp/systemd/SecureTunnel.service /etc/systemd/system/${service_name}.service
sed -i "s#{dir}#${dir}#g" /etc/systemd/system/${service_name}.service
sed -i "s#{api}#${api}#g" /etc/systemd/system/${service_name}.service
sed -i "s#{id}#${id}#g" /etc/systemd/system/${service_name}.service
sed -i "s#{secret}#${secret}#g" /etc/systemd/system/${service_name}.service

rm -rf /tmp/*

echo -e "${Font_Yellow} ** Starting program...${Font_Suffix}"
systemctl daemon-reload
systemctl enable --now ${service_name}

echo -e "${Font_Green} [Success] Completed installation${Font_Suffix}"
