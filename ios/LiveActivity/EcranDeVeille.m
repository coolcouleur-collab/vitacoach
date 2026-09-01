#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Capacitor ne decouvre pas les plugins Swift tout seul : il passe par le
// runtime Objective-C. Sans ce fichier, EcranDeVeille.swift compile mais reste
// invisible depuis le JavaScript, et registerPlugin renvoie un objet vide.
CAP_PLUGIN(EcranDeVeille, "EcranDeVeille",
  CAP_PLUGIN_METHOD(disponible,   CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(demarrer,     CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(mettreAJour,  CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(arreter,      CAPPluginReturnPromise);
)
