// ZH-gyakorló indító: a lefordított appot (dist mappa) helyi szerverről szolgálja ki, és megnyitja a
// böngészőben. A tálcán (értesítési területen) egy ikon marad; jobb gomb → Kilépés.
// Ugyanazon a címen fut, mint a fejlesztői szerver (http://localhost:5240), így a böngészőben tárolt
// statisztika és ZH-eredmények ugyanazok maradnak.
//
// Fordítás (a projekt gyökeréből): indito\forditas.cmd

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

static class Indito
{
    const int Port = 5240;
    static readonly string Cim = "http://localhost:" + Port + "/";
    static string gyoker;
    static HttpListener figyelo;

    [STAThread]
    static void Main(string[] args)
    {
        // --csak-szerver: nem nyit böngészőt (ellenőrzéshez)
        bool bongeszo = Array.IndexOf(args, "--csak-szerver") < 0;
        string exeMappa = AppDomain.CurrentDomain.BaseDirectory;
        gyoker = Path.Combine(exeMappa, "dist");
        if (!File.Exists(Path.Combine(gyoker, "index.html")))
        {
            MessageBox.Show(
                "Nem találom a lefordított appot: " + gyoker + "\n\nElőbb futtasd a projekt mappájában: npm run build",
                "ZH-gyakorló", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        // ha már fut (ez az indító vagy a fejlesztői szerver), csak megnyitjuk
        if (PortFoglalt())
        {
            if (bongeszo) Megnyit();
            return;
        }

        figyelo = new HttpListener();
        figyelo.Prefixes.Add(Cim);
        try
        {
            figyelo.Start();
        }
        catch (Exception e)
        {
            MessageBox.Show("Nem sikerült elindítani a helyi szervert (" + Cim + "):\n" + e.Message, "ZH-gyakorló",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        var szal = new Thread(Kiszolgal) { IsBackground = true };
        szal.Start();

        var menu = new ContextMenuStrip();
        menu.Items.Add("Megnyitás a böngészőben", null, delegate { Megnyit(); });
        menu.Items.Add("Kilépés", null, delegate { Application.Exit(); });
        var ikon = new NotifyIcon
        {
            Icon = Ikon(),
            Text = "ZH-gyakorló (" + Cim + ")",
            ContextMenuStrip = menu,
            Visible = true,
        };
        ikon.DoubleClick += delegate { Megnyit(); };

        if (bongeszo) Megnyit();
        Application.Run();

        ikon.Visible = false;
        figyelo.Stop();
    }

    static Icon Ikon()
    {
        try
        {
            return Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        }
        catch
        {
            return SystemIcons.Application;
        }
    }

    static bool PortFoglalt()
    {
        try
        {
            using (var c = new TcpClient())
            {
                var kapcs = c.BeginConnect("127.0.0.1", Port, null, null);
                bool ok = kapcs.AsyncWaitHandle.WaitOne(300) && c.Connected;
                return ok;
            }
        }
        catch
        {
            return false;
        }
    }

    static void Megnyit()
    {
        try
        {
            Process.Start(new ProcessStartInfo(Cim) { UseShellExecute = true });
        }
        catch (Exception e)
        {
            MessageBox.Show("Nem sikerült megnyitni a böngészőt: " + e.Message + "\nNyisd meg kézzel: " + Cim, "ZH-gyakorló");
        }
    }

    static void Kiszolgal()
    {
        while (figyelo.IsListening)
        {
            HttpListenerContext k;
            try
            {
                k = figyelo.GetContext();
            }
            catch
            {
                return;
            }
            ThreadPool.QueueUserWorkItem(delegate { Valasz(k); });
        }
    }

    static void Valasz(HttpListenerContext k)
    {
        try
        {
            string ut = Uri.UnescapeDataString(k.Request.Url.AbsolutePath).TrimStart('/');
            if (ut == "") ut = "index.html";
            string teljes = Path.GetFullPath(Path.Combine(gyoker, ut.Replace('/', Path.DirectorySeparatorChar)));
            // csak a dist mappán belülről szolgálunk ki
            if (!teljes.StartsWith(Path.GetFullPath(gyoker), StringComparison.OrdinalIgnoreCase) || !File.Exists(teljes))
            {
                k.Response.StatusCode = 404;
                k.Response.Close();
                return;
            }
            byte[] adat = File.ReadAllBytes(teljes);
            k.Response.ContentType = Tipus(Path.GetExtension(teljes));
            // az index.html mindig friss legyen (új build után), a hash-elt fájlok gyorsítótárazhatók
            k.Response.Headers["Cache-Control"] = ut == "index.html" ? "no-cache" : "max-age=31536000, immutable";
            k.Response.ContentLength64 = adat.Length;
            k.Response.OutputStream.Write(adat, 0, adat.Length);
            k.Response.Close();
        }
        catch
        {
            try { k.Response.Abort(); } catch { }
        }
    }

    static string Tipus(string kit)
    {
        switch (kit.ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": return "text/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json";
            case ".svg": return "image/svg+xml";
            case ".png": return "image/png";
            case ".ico": return "image/x-icon";
            case ".woff2": return "font/woff2";
            case ".woff": return "font/woff";
            case ".ttf": return "font/ttf";
            default: return "application/octet-stream";
        }
    }
}
