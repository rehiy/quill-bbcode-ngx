@ECHO OFF

CD /D %~dp0

::设置系统环境

SET "PATH=.\node_modules\.bin;%PATH%"
SET "PATH=%PATH%;D:\Software\PortableGit\bin"

::加载Node环境

IF EXIST D:\RunTime\node\runtime.bat (
    CALL D:\RunTime\node\runtime set "%~n0"
)

::加载Python27环境

IF EXIST D:\RunTime\python27\runtime.bat (
    CALL D:\RunTime\python27\runtime set "%~n0"
)

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

::编译项目

CD /D %~dp0

CMD /C "npm install && npm run build"

IF "%1" == "" CMD /K
