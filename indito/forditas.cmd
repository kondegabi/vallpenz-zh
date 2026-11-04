@echo off
rem Az indito (ZH-gyakorlo.exe) forditasa. Elotte: npm run build
cd /d "%~dp0.."
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /optimize+ /codepage:65001 /win32icon:indito\ikon.ico /out:ZH-gyakorlo.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll indito\Indito.cs
