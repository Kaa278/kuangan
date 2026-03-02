# Panduan Aktivasi Bot Telegram KuAngan

Ikuti langkah-langkah di bawah ini untuk menghubungkan bot Telegram dengan akun KuAngan Anda agar bisa mencatat transaksi lewat chat atau foto struk.

## 1. Buat Bot di Telegram
1. Buka aplikasi Telegram dan cari **@BotFather**.
2. Ketik `/newbot` dan ikuti instruksinya (beri nama dan username bot Anda).
3. Setelah selesai, Anda akan mendapatkan **API TOKEN** (contoh: `123456:ABC-DEF1234ghIkl-zyx57W2v1u1`).

## 2. Setting di Vercel (Deployment)
1. Buka dashboard Vercel Anda untuk project `kuangan`.
2. Masuk ke menu **Settings** > **Environment Variables**.
3. Tambahkan variabel baru:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: (Masukkan API TOKEN dari BotFather tadi)
4. Klik **Save**.
5. Jangan lupa untuk melakukan **Redeploy** aplikasi agar perubahan variabel terbaca.

## 3. Daftarkan Webhook
Anda perlu memberi tahu Telegram ke mana mereka harus mengirim pesan. Buka link ini di browser Anda (ganti `<TOKEN>` dengan API TOKEN Anda):

`https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://kuangan.vercel.app/api/webhook-telegram`

Jika berhasil, Anda akan melihat pesan: `{"ok":true,"result":true,"description":"Webhook was set"}`.

## 4. Hubungkan Akun (Linking)
1. Buka aplikasi KuAngan Anda dan masuk ke menu **Pengaturan**.
2. Cari seksi **Integrasi Telegram Bot**.
3. Buka bot Telegram Anda yang baru saja dibuat, lalu ketik `/start`.
4. Bot akan memberikan **Telegram ID** Anda.
5. Salin ID tersebut dan tempelkan di kolom **Telegram ID** pada halaman Pengaturan aplikasi KuAngan, lalu klik **Simpan**.

---

**Selesai!** Sekarang Anda bisa mencatat transaksi dengan cara:
- **Teks**: "Beli bakso 20rb" atau "Gaji bulanan 5jt".
- **Foto**: Kirim foto struk belanjaan, si Kathlyn akan otomatis membacanya! 🚀
