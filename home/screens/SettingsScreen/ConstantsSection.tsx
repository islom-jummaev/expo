import Constants from 'expo-constants';
import { View, Divider } from 'expo-dev-client-components';
import * as React from 'react';
import { Clipboard, Alert } from 'react-native';

import { ConstantItem } from '../../components/ConstantItem';
import Environment from '../../utils/Environment';
import getSnackId from '../../utils/getSnackId';

export function ConstantsSection() {
  const copySnackIdToClipboard = () => {
    Clipboard.setString(getSnackId());

    // Should have some integrated alert banner
    Alert.alert('Clipboard', 'The device ID has been copied to your clipboard');
  };

  const copyClientVersionToClipboard = () => {
    if (Constants.expoVersion) {
      Clipboard.setString(Constants.expoVersion);
      Alert.alert('Clipboard', `The app's version has been copied to your clipboard.`);
    } else {
      // this should not ever happen
      Alert.alert('Clipboard', `Something went wrong - the app's version is not available.`);
    }
  };

  return (
    <View bg="default" border="hairline" overflow="hidden" rounded="large">
      <ConstantItem title="Device ID" value={getSnackId()} onPress={copySnackIdToClipboard} />
      <Divider />
      {Constants.expoVersion ? (
        <>
          <ConstantItem
            title="Client version"
            value={Constants.expoVersion}
            onPress={copyClientVersionToClipboard}
          />
          <Divider />
        </>
      ) : null}
      <ConstantItem title="Supported SDKs" value={Environment.supportedSdksString} />
    </View>
  );
}
