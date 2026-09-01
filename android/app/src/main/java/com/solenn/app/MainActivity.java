package com.solenn.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Les plugins ecrits dans le module applicatif ne sont pas decouverts
        // tout seuls : ils doivent etre declares AVANT super.onCreate, sinon le
        // pont demarre sans eux et le JavaScript ne voit qu'un objet vide.
        registerPlugin(SanteConnect.class);
        super.onCreate(savedInstanceState);
    }
}
