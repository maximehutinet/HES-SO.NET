#!/usr/bin/env bash

# ------------------------------------------------------------------
# [Gonçalves José] <jose.goncalves@dlcproduction.ch>
#
# start_back.sh
#       Used to bootstrap boxes.
#
# ------------------------------------------------------------------
set -e
shopt -s expand_aliases

# --- Time Execution -----------------------------------------------
start_time=$(date +%s)

# --- Global Vars --------------------------------------------------
VERSION=0.0.1
SUBJECT=$(cat /proc/sys/kernel/random/uuid)
USAGE="
Usage: start_vagrant.sh -hv -d <path>

    -v      Show version
    -h      Show help
    -d      Destination (django app)

Notes: Vagrant must be installed on your local machine.
"
MAILTO="jose.goncalves@dlcproduction.ch"
CURRENT_PATH=$(pwd)

# --- [Color and fonts] --------------------------------------------
FT_BOLD="\e[1m"
FT_RED="\e[91m"
FT_GREEN="\e[92m"
FT_WHITE="\e[39m"
FT_DEFAULT="\e[0m"

# --- Options processing -------------------------------------------

if [ $# == 0 ] ; then
    echo "${USAGE}"
    exit 1;
fi

while getopts ":d:vh" optname
  do
    case "${optname}" in
        "v")
            echo "Version ${VERSION}"
            exit 0;
            ;;
        "h")
            echo "${USAGE}"
            exit 1;
            ;;
        "d")
            WORK_PATH=${OPTARG}
            ;;
        "?")
            echo "Unknown option ${OPTARG}"
            exit 3;
            ;;
        ":")
            echo "No argument value for option ${OPTARG}"
            exit 4;
            ;;
    esac
done

shift $((${OPTIND} - 1))

# --- Locks -------------------------------------------------------
LOCK_FILE=/tmp/$SUBJECT.lock
if [ -f "${LOCK_FILE}" ]; then
   echo "Script is already running"
   exit
fi

trap 'rm -f ${LOCK_FILE}' EXIT
touch "${LOCK_FILE}"

# --- Syslog ------------------------------------------------------
readonly SCRIPT_NAME=$(basename "$0")

log() {
  echo -e "$@"
  logger -p user.notice -t "${SCRIPT_NAME}" "$@"
}

err() {
  echo -e "$@" >&2
  logger -p user.error -t "${SCRIPT_NAME}" "$@"
}

# --- Functions ----------------------------------------------------
closeScript(){
    end_time=$(date +%s)

    echo -e "${FT_BOLD}"
    log "+-----------------------------------------"
    log "| - Execution time was : $(expr ${end_time} - ${start_time}) s."
    log "+-----------------------------------------"
    echo -e "${FT_DEFAULT}"
}

# Starting backend boxes
if [[ ${WORK_PATH} == "app" ]] ; then
    log "${FT_BOLD}${FT_WHITE}[${FT_GREEN}*${FT_WHITE}] ${FT_DEFAULT}=> Removing old migration files... "
    rm -rf backend/migrations/0*.py
    sleep 5
    log "${FT_BOLD}${FT_WHITE}[${FT_GREEN}*${FT_WHITE}] ${FT_DEFAULT}=> Init. Database and prerequisites... "
    python manage.py makemigrations
    python manage.py migrate

    log "${FT_BOLD}${FT_WHITE}[${FT_GREEN}*${FT_WHITE}] ${FT_DEFAULT}=> Creating a new user..."
    python manage.py createsuperuserwithpassword --name admin --password admin --preserve

    log "${FT_BOLD}${FT_WHITE}[${FT_GREEN}*${FT_WHITE}] ${FT_DEFAULT}=> Starting Backend Server..."
    python manage.py runserver 0.0.0.0:8000
else
    log "${FT_BOLD}${FT_WHITE}[${FT_GREEN}*${FT_WHITE}] ${FT_DEFAULT}=> Starting FrontEnd Server..."
    python manage.py runserver 0.0.0.0:8000
fi

closeScript

exit 0;
