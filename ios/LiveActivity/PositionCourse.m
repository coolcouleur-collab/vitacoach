#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Sans cette declaration, PositionCourse.swift compile mais reste invisible
// depuis le JavaScript : Capacitor decouvre ses plugins par le runtime
// Objective-C, pas en lisant le Swift.
CAP_PLUGIN(PositionCourse, "PositionCourse",
  CAP_PLUGIN_METHOD(demanderAutorisation, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(demarrer,             CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(arreter,              CAPPluginReturnPromise);
)
