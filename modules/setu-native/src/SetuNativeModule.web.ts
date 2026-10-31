import { registerWebModule, NativeModule } from 'expo';

class SetuNativeModule extends NativeModule<{}> {}

export default registerWebModule(SetuNativeModule, 'SetuNativeModule');
