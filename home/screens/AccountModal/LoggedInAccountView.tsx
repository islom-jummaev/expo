import { borderRadius, CheckIcon, iconSize, spacing, UsersIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { SectionHeader } from 'components/SectionHeader';
import { Text, View, Image, useExpoTheme, Row, Spacer } from 'expo-dev-client-components';
import React from 'react';
import { FlatList } from 'react-native';

import { PressableOpacity } from '../../components/PressableOpacity';
import { Home_CurrentUserQuery } from '../../graphql/types';
import { useDispatch } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';
import { useAccountName } from '../../utils/AccountNameContext';

type Props = {
  accounts: Exclude<Home_CurrentUserQuery['viewer'], undefined | null>['accounts'];
};

export function LoggedInAccountView({ accounts }: Props) {
  const { accountName, setAccountName } = useAccountName();
  const navigation = useNavigation();
  const theme = useExpoTheme();
  const dispatch = useDispatch();

  const onSignOutPress = React.useCallback(() => {
    dispatch(SessionActions.signOut());
  }, [dispatch]);

  return (
    <View flex="1">
      <View flex="1">
        <FlatList<typeof accounts[number]>
          data={accounts}
          contentContainerStyle={{ padding: spacing[4] }}
          ListHeaderComponent={() => (
            <>
              <SectionHeader header="Log Out" style={{ paddingTop: 0 }} />
              <PressableOpacity
                onPress={onSignOutPress}
                style={{
                  backgroundColor: theme.button.tertiary.background,
                  padding: spacing[3],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                borderRadius={borderRadius.medium}>
                <Text style={{ color: theme.button.tertiary.foreground }} type="InterSemiBold">
                  Log Out
                </Text>
              </PressableOpacity>
              <Spacer.Vertical size="large" />
              <SectionHeader header="Switch Account" style={{ paddingTop: 0 }} />
            </>
          )}
          keyExtractor={(account) => account.id}
          renderItem={({ item: account }) => (
            <PressableOpacity
              key={account.id}
              style={{ padding: 16 }}
              containerProps={{ bg: 'default', border: 'hairline', rounded: 'large' }}
              onPress={() => {
                setAccountName(account.name);
                navigation.goBack();
              }}>
              <Row justify="between">
                <Row align={!account.owner?.fullName ? 'center' : 'start'}>
                  {account?.owner?.profilePhoto ? (
                    <Image size="xl" rounded="full" source={{ uri: account.owner.profilePhoto }} />
                  ) : (
                    <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
                      <UsersIcon color={theme.icon.default} size={iconSize.small} />
                    </View>
                  )}
                  <Spacer.Horizontal size="small" />
                  <View>
                    {account.owner ? (
                      <>
                        {account.owner.fullName ? (
                          <>
                            <Text type="InterBold">{account.owner.fullName}</Text>
                            <Spacer.Vertical size="tiny" />
                            <Text color="secondary" type="InterRegular" size="small">
                              {account.owner.username}
                            </Text>
                          </>
                        ) : (
                          <Text type="InterBold">{account.owner.username}</Text>
                        )}
                      </>
                    ) : (
                      <Text type="InterBold">{account.name}</Text>
                    )}
                  </View>
                </Row>
                {accountName === account.name && (
                  <CheckIcon color={theme.icon.default} size={iconSize.large} />
                )}
              </Row>
            </PressableOpacity>
          )}
          ItemSeparatorComponent={() => <Spacer.Vertical size="small" />}
        />
      </View>
    </View>
  );
}
