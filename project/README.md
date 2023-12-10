bash build.sh contracts.contract

goal app create --creator $ONE --approval-prog /data/build/approval.teal --clear-prog /data/build/clear.teal --global-byteslices 0 --global-ints 0 --local-byteslices 7 --local-ints 1

goal app info --app-id 1

goal app optin --from $ONE --app-id 1
goal app optin --from $TWO --app-id 1

goal app read --local --from $ONE --app-id 1

bash /data/tests/test1.sh

goal clerk send -a 200000 -f $TWO -t $acc

*kad smo u testnetu usli smo vec u /data, korisitmo ovo: cd /data
export ONE=$acc

goal app create --approval-prog build/approval.teal --clear-prog build/clear.teal --global-byteslices 0 --global-ints 0 --local-byteslices 7 --local-ints 1 --creator $ONE

mnemonics:
strong book series test stay slow transfer walk pipe narrow punch fat gorilla ignore seminar spend lonely trip plastic during lunch avoid van abandon this

hurry riot goddess achieve machine planet can question image sea jar celery update thing mail cycle fix jeans enhance blast ankle party image about parent