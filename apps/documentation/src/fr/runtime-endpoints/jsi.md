# React Native JSI Endpoints

Le package React Native expose un endpoint de setup et mappe les endpoints natifs JSI.

## Setup

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";
setupGiovanni();
```

## Endpoints exposes sur globalThis.giovanni

- `getVersion()`
- `writePdf(data, opts?, password?)`
- `splitPages(data)`
- `mergePdfs(inputs)`
- `getDocumentInfo(data, password?)`
- `extractImages(data)`

Note: ces endpoints sont synchrones au niveau bridge natif.