// src/components/InteractiveMap.js
import { Platform } from 'react-native';
import InteractiveMapNative from './InteractiveMap.native';
import InteractiveMapWeb from './InteractiveMap.web';

const InteractiveMap = Platform.OS === 'web' ? InteractiveMapWeb : InteractiveMapNative;

export default InteractiveMap;
