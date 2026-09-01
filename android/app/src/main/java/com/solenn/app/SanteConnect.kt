package com.solenn.app

// ─────────────────────────────────────────────────────────────────────────────
// LE PONT HEALTH CONNECT
//
// Solenn lisait les donnees de sante sur iPhone, par HealthKit, et nulle part
// ailleurs. Sur Android, le manifeste reclamait pourtant deja l'acces aux pas,
// au sommeil et au rythme cardiaque : des permissions demandees, jamais
// utilisees. Les utilisateurs Android n'avaient donc AUCUNE metrique
// automatique, et Google refuse les permissions de sante declarees sans usage
// visible.
//
// Ce pont comble ce trou. Il expose au JavaScript exactement la meme forme que
// useHealthKit : { pas, sommeil, fc, poids }. L'ecran d'en face n'a pas a
// savoir de quelle plateforme viennent les chiffres.
//
// Ecrit ici plutot qu'emprunte a un plugin de la communaute : ce sont les
// donnees de sante des utilisateurs, et c'est le seul endroit de l'app ou un
// intermediaire non maintenu n'a rien a faire.
//
// Trois choses que Health Connect fait differemment de HealthKit :
//
//   · il peut etre ABSENT de l'appareil. Avant Android 14 c'est une
//     application a installer. D'ou `disponible()`, qui distingue « pas
//     installe » de « pas compatible » : le premier se repare, pas le second.
//   · les permissions ne se demandent pas par un simple intent, mais par un
//     contrat de resultat d'activite.
//   · une permission accordee peut etre RETIREE a tout moment depuis Health
//     Connect, sans que l'app soit prevenue. On les revoit donc a chaque
//     lecture, au lieu de se fier a un drapeau garde en memoire.
// ─────────────────────────────────────────────────────────────────────────────

import android.content.Intent
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.aggregate.AggregationResult
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

@CapacitorPlugin(name = "SanteConnect")
class SanteConnect : Plugin() {

    /** Ce qu'on demande, et rien de plus. Chaque ligne est justifiable a Google. */
    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
    )

    private fun client(): HealthConnectClient? = try {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE)
            HealthConnectClient.getOrCreate(context)
        else null
    } catch (e: Throwable) {
        null
    }

    // ── Disponibilite ────────────────────────────────────────────────────────

    /**
     * Trois reponses possibles, et l'ecran doit les distinguer :
     * compatible et pret, compatible mais a installer, ou pas compatible.
     * Proposer d'installer a quelqu'un dont le telephone ne peut pas est le
     * genre de detail qui fait desinstaller une app.
     */
    @PluginMethod
    fun disponible(call: PluginCall) {
        val statut = try {
            HealthConnectClient.getSdkStatus(context)
        } catch (e: Throwable) {
            HealthConnectClient.SDK_UNAVAILABLE
        }
        val res = JSObject()
        res.put("disponible", statut == HealthConnectClient.SDK_AVAILABLE)
        res.put(
            "aInstaller",
            statut == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        )
        call.resolve(res)
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    @PluginMethod
    fun permissionsAccordees(call: PluginCall) {
        val c = client()
        if (c == null) { call.resolve(JSObject().put("accorde", false)); return }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val accordees = c.permissionController.getGrantedPermissions()
                // « Toutes » et non « au moins une » : une lecture partielle
                // renverrait des metriques manquantes sans dire pourquoi.
                call.resolve(JSObject().put("accorde", accordees.containsAll(permissions)))
            } catch (e: Throwable) {
                call.resolve(JSObject().put("accorde", false))
            }
        }
    }

    /**
     * Health Connect ne se demande pas par un intent ordinaire : il passe par
     * un contrat de resultat d'activite. On en extrait l'intent pour le donner
     * au pont Capacitor, qui sait attendre un resultat.
     */
    @PluginMethod
    fun demanderPermissions(call: PluginCall) {
        if (client() == null) { call.resolve(JSObject().put("accorde", false)); return }
        try {
            val contrat = PermissionController.createRequestPermissionResultContract()
            val intent = contrat.createIntent(context, permissions)
            startActivityForResult(call, intent, "retourPermissions")
        } catch (e: Throwable) {
            call.resolve(JSObject().put("accorde", false))
        }
    }

    /**
     * Le resultat rendu par l'ecran de Health Connect n'est pas fiable : il
     * vaut « l'ecran s'est ferme », pas « c'est accorde ». On redemande donc
     * la liste reelle des permissions accordees.
     */
    @ActivityCallback
    private fun retourPermissions(call: PluginCall?, result: ActivityResult?) {
        if (call == null) return
        val c = client()
        if (c == null) { call.resolve(JSObject().put("accorde", false)); return }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val accordees = c.permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("accorde", accordees.containsAll(permissions)))
            } catch (e: Throwable) {
                call.resolve(JSObject().put("accorde", false))
            }
        }
    }

    // ── Lecture ──────────────────────────────────────────────────────────────

    /**
     * Les metriques du jour, dans la meme forme que useHealthKit :
     * { pas, sommeil, fc, poids }. Une metrique absente est ABSENTE de l'objet,
     * jamais mise a zero : zero pas et pas de donnee sont deux choses
     * differentes, et l'accueil de Solenn affiche l'une comme un constat.
     */
    @PluginMethod
    fun lireAujourdhui(call: PluginCall) {
        val c = client()
        if (c == null) { call.reject("Health Connect indisponible"); return }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val accordees = c.permissionController.getGrantedPermissions()
                if (accordees.isEmpty()) { call.reject("Permissions non accordees"); return@launch }

                val zone = ZoneId.systemDefault()
                val debutJour = LocalDate.now(zone).atStartOfDay(zone).toInstant()
                val maintenant = Instant.now()
                // Le sommeil de la nuit commence la veille au soir : le lire
                // depuis minuit ne trouverait que les siestes.
                val hier = debutJour.minus(Duration.ofDays(1))

                val res = JSObject()

                lireOuIgnorer {
                    if (!accordees.contains(HealthPermission.getReadPermission(StepsRecord::class))) return@lireOuIgnorer
                    val agr: AggregationResult = c.aggregate(
                        AggregateRequest(
                            metrics = setOf(StepsRecord.COUNT_TOTAL),
                            timeRangeFilter = TimeRangeFilter.between(debutJour, maintenant),
                        )
                    )
                    agr[StepsRecord.COUNT_TOTAL]?.let { if (it > 0) res.put("pas", it.toInt()) }
                }

                lireOuIgnorer {
                    if (!accordees.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) return@lireOuIgnorer
                    val sessions = c.readRecords(
                        ReadRecordsRequest(
                            recordType = SleepSessionRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(hier, maintenant),
                        )
                    ).records
                    val minutes = sessions.sumOf {
                        Duration.between(it.startTime, it.endTime).toMinutes()
                    }
                    if (minutes > 0) {
                        res.put("sommeil", Math.round(minutes / 60.0 * 10.0) / 10.0)
                    }
                }

                lireOuIgnorer {
                    if (!accordees.contains(HealthPermission.getReadPermission(HeartRateRecord::class))) return@lireOuIgnorer
                    val agr = c.aggregate(
                        AggregateRequest(
                            metrics = setOf(HeartRateRecord.BPM_AVG),
                            timeRangeFilter = TimeRangeFilter.between(debutJour, maintenant),
                        )
                    )
                    agr[HeartRateRecord.BPM_AVG]?.let { if (it > 0) res.put("fc", it.toInt()) }
                }

                lireOuIgnorer {
                    if (!accordees.contains(HealthPermission.getReadPermission(WeightRecord::class))) return@lireOuIgnorer
                    // Le poids ne se pese pas tous les jours : on remonte a un
                    // mois, sinon le champ reste vide pour presque tout le monde.
                    val mois = maintenant.minus(Duration.ofDays(30))
                    val pesees = c.readRecords(
                        ReadRecordsRequest(
                            recordType = WeightRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(mois, maintenant),
                        )
                    ).records
                    pesees.maxByOrNull { it.time }?.let {
                        val kg = it.weight.inKilograms
                        if (kg > 0) res.put("poids", (kg * 10).roundToInt() / 10.0)
                    }
                }

                call.resolve(res)
            } catch (e: Throwable) {
                call.reject(e.message ?: "Lecture Health Connect impossible")
            }
        }
    }

    /**
     * Une metrique qui echoue ne doit pas emporter les trois autres. Sans ca,
     * un utilisateur ayant refuse le seul rythme cardiaque perdrait aussi ses
     * pas et son sommeil, qu'il avait pourtant accordes.
     */
    private inline fun lireOuIgnorer(bloc: () -> Unit) {
        try { bloc() } catch (e: Throwable) { /* metrique absente, pas une erreur */ }
    }

    // ── Reglages ─────────────────────────────────────────────────────────────

    /** Ouvre Health Connect, pour installer ou pour revoir les autorisations. */
    @PluginMethod
    fun ouvrirReglages(call: PluginCall) {
        try {
            val intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (e: Throwable) {
            call.reject("Impossible d'ouvrir Health Connect")
        }
    }
}
