@echo off

REM See http://stackoverflow.com/q/1642677/1143274
FOR /f %%a IN ('WMIC OS GET LocalDateTime ^| FIND "."') DO SET DTS=%%a
SET DateTime=%DTS:~0,4%-%DTS:~4,2%-%DTS:~6,2%_%DTS:~8,2%-%DTS:~10,2%-%DTS:~12,2%

set outFile=../second-lock-%DateTime%.zip

@echo on
python gen-trans-key.py
zip %outFile% ./*.json ./*.html ./js/* ./css/* ./images/* ./_locales/*/*
