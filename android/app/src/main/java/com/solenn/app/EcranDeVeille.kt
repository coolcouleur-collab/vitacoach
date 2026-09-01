package com.solenn.app

// ─────────────────────────────────────────────────────────────────────────────
// LE PONT VERS L'ÉCRAN DE VEILLE
//
// Le JavaScript sait mesurer le temps et la distance. Il ne sait pas les faire
// survivre au verrouillage de l'ecran : ca, c'est le systeme qui le decide, et
// il ne l'accorde qu'a un service de premier plan.
//
// Ce plugin est la porte entre les deux. Le JavaScript dit « je pars courir »,
// « voila ou j'en suis », « j'ai fini », et le service tient la notification a
// jour pendant ce temps.
//
// La disponibilite est repondue honnetement, et c'est important : sans la
// permission de position fine, le systeme refuse un service de type
// geolocalise en levant une exception qui ferme l'application. Mieux vaut une
// course sans ecran de veille qu'une application qui se ferme au premier pas.
// ─────────────────────────────────────────────────────────────────────────────

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "EcranDeVeille")
class EcranDeVeille : Plugin() {

    /** Peut-on tenir la course a l'ecran verrouille sur cet appareil ? */
    @PluginMethod
    fun disponible(call: PluginCall) {
        call.resolve(JSObject().put("disponible", CourseService.peutDemarrer(context)))
    }

    @PluginMethod
    fun demarrer(call: PluginCall) {
        if (!CourseService.peutDemarrer(context)) {
            // On ne rejette pas : l'appelant doit pouvoir continuer sa course
            // sans ecran de veille, pas se prendre une erreur en pleine figure.
            call.resolve(JSObject().put("demarre", false))
            return
        }
        try {
            val i = Intent(context, CourseService::class.java).apply {
                action = CourseService.ACTION_DEMARRER
                remplir(this, call)
            }
            context.startForegroundService(i)
            call.resolve(JSObject().put("demarre", true))
        } catch (e: Throwable) {
            call.resolve(JSObject().put("demarre", false))
        }
    }

    @PluginMethod
    fun mettreAJour(call: PluginCall) {
        try {
            val i = Intent(context, CourseService::class.java).apply {
                action = CourseService.ACTION_MAJ
                remplir(this, call)
            }
            context.startService(i)
        } catch (e: Throwable) {
            // Une mise a jour perdue ne vaut pas une erreur : la suivante
            // arrive une seconde plus tard.
        }
        call.resolve()
    }

    /**
     * Les memes cinq valeurs pour le demarrage et pour la mise a jour. Les
     * recopier deux fois, c'est se garantir qu'un jour l'une des deux oubliera
     * l'instant de depart, et que le chronometre repartira de zero.
     */
    private fun remplir(i: Intent, call: PluginCall) {
        i.putExtra(CourseService.EXTRA_TITRE, call.getString("titre") ?: "Course en cours")
        i.putExtra(CourseService.EXTRA_TEXTE, call.getString("texte") ?: "")
        i.putExtra(CourseService.EXTRA_BASE, call.getLong("base") ?: 0L)
        i.putExtra(CourseService.EXTRA_COURT, call.getBoolean("court") ?: true)
        i.putExtra(CourseService.EXTRA_FIGE, call.getString("fige") ?: "")
    }

    @PluginMethod
    fun arreter(call: PluginCall) {
        try {
            val i = Intent(context, CourseService::class.java).apply {
                action = CourseService.ACTION_ARRETER
            }
            context.startService(i)
        } catch (e: Throwable) {
        }
        call.resolve()
    }
}
