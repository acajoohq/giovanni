# Exemples

Des applications d'exemple exécutables qui utilisent `@acajoo/giovanni-core` dans un vrai navigateur, dans [`examples/`](https://github.com/acajoohq/giovanni/tree/master/examples) à la racine du dépôt.

<div class="examples-table">

| Exemple           | Source                                                                                    | Description                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **web-simple**    | [Voir la source](https://github.com/acajoohq/giovanni/tree/master/examples/web-simple)    | Une démo minimale de compression par glisser-déposer : choisissez ou déposez un PDF, sélectionnez un moteur (qpdf, Ghostscript ou combiné) et un préréglage, puis téléchargez le résultat compressé avec les statistiques de taille avant/après. Un bon point de départ pour intégrer `compressPdf` dans une interface.                                      |
| **wasm-standard** | [Voir la source](https://github.com/acajoohq/giovanni/tree/master/examples/wasm-standard) | Un banc de test qui exécute presque toutes les fonctions exportées — les deux moteurs de compression, `QpdfDocument`, `splitPdf`, `mergePdfs`, `organizePdf`, `extractImages`, les classes d'erreur, les registres de bindings, etc. — sur un PDF d'exemple et rapporte le succès/échec de chaque étape. Utile comme référence de toute la surface de l'API. |

</div>

## Exécuter un exemple localement

```bash
pnpm install
pnpm -F @acajoo/giovanni-core build
pnpm --filter ./examples/web-simple dev      # ou ./examples/wasm-standard
```

Chaque exemple est une application Vite autonome qui dépend de `@acajoo/giovanni-core` via le workspace ; le package core doit donc être compilé au préalable.
