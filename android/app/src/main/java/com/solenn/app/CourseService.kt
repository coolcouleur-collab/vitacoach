package com.solenn.app

// ─────────────────────────────────────────────────────────────────────────────
// LA COURSE QUI CONTINUE ÉCRAN VERROUILLÉ
//
// Sans ce fichier, verrouiller le téléphone pendant une course arrête tout.
// Android ne laisse pas une application continuer a travailler en arriere plan
// simplement parce qu'elle le voudrait : il faut lui dire ce qu'on fait, et
// l'afficher a l'utilisateur pendant qu'on le fait. C'est exactement ce qu'est
// un service de premier plan : une promesse visible, sous la forme d'une
// notification qu'on ne peut pas balayer.
//
// C'est aussi ce qui fait que la course apparait sur l'ecran de veille, comme
// un lecteur de musique. La notification N'EST PAS un effet secondaire, elle
// est la contrepartie exigee par le systeme.
//
// Ce service ne mesure rien lui-meme. La position, la distance et le temps
// sont calcules cote JavaScript, qui lui envoie les deux lignes a afficher. Le
// service, lui, ne sert qu'a deux choses : garder le processus en vie, et
// tenir la promesse a l'ecran.
//
// Depuis Android 14, un service qui accompagne une activite geolocalisee doit
// declarer son type, et le systeme REFUSE de le demarrer si l'application n'a
// pas la permission de position fine. D'ou le controle avant demarrage : mieux
// vaut une course sans ecran de veille qu'une application qui se ferme.
// ─────────────────────────────────────────────────────────────────────────────

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class CourseService : Service() {

    companion object {
        const val CANAL = "solenn_course"
        const val ID_NOTIFICATION = 4201

        const val ACTION_DEMARRER = "com.solenn.app.COURSE_DEMARRER"
        const val ACTION_MAJ      = "com.solenn.app.COURSE_MAJ"
        const val ACTION_ARRETER  = "com.solenn.app.COURSE_ARRETER"

        const val EXTRA_TITRE = "titre"
        const val EXTRA_TEXTE = "texte"

        /**
         * Le systeme refuse un service de type « location » a une application
         * qui n'a pas la position fine, et il le refuse en levant une
         * exception qui ferme l'app. On regarde donc avant de demander.
         */
        fun peutDemarrer(context: Context): Boolean =
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_ARRETER -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val titre = intent?.getStringExtra(EXTRA_TITRE) ?: "Course en cours"
                val texte = intent?.getStringExtra(EXTRA_TEXTE) ?: ""
                creerCanal()
                val notif = construire(titre, texte)

                if (intent?.action == ACTION_MAJ) {
                    // Une simple mise a jour : notify suffit, et surtout ne
                    // relance pas le service, ce qui reinitialiserait son etat
                    // plusieurs fois par seconde pendant toute la course.
                    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    nm.notify(ID_NOTIFICATION, notif)
                } else {
                    startForeground(ID_NOTIFICATION, notif)
                }
            }
        }
        // START_NOT_STICKY : si le systeme tue le service faute de memoire, il
        // ne doit PAS le ressusciter tout seul. Une course fantome qui repart
        // sans coureur est pire que pas de course du tout.
        return START_NOT_STICKY
    }

    private fun creerCanal() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CANAL) != null) return
        val canal = NotificationChannel(
            CANAL,
            "Course en cours",
            // LOW et non DEFAULT : cette notification s'actualise a chaque
            // seconde. En importance normale, elle ferait vibrer le telephone
            // et sonner a chaque mise a jour, pendant toute la sortie.
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Affiche le temps et la distance pendant une sortie"
            setShowBadge(false)
            enableVibration(false)
            setSound(null, null)
        }
        nm.createNotificationChannel(canal)
    }

    private fun construire(titre: String, texte: String): Notification {
        // Toucher la notification doit ramener dans l'app, sur la course en
        // cours, et non en ouvrir une seconde instance par dessus.
        val ouvrir = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            this, 0, ouvrir,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CANAL)
            .setContentTitle(titre)
            .setContentText(texte)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setUsesChronometer(false)
            .build()
    }
}
