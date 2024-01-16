import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet } from 'react-native';
import { Header, Text, Button } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { FormState } from '../../store';
import { generateDataPointName } from '../../form/lib';

const BackButton = ({ navigation }) => {
  const handleGoBackPress = () => {
    navigation.goBack();
  };

  return navigation.canGoBack() ? (
    <Button type="clear" onPress={handleGoBackPress} testID="arrow-back-button">
      <Icon name="arrow-back" size={18} />
    </Button>
  ) : (
    <Text />
  );
};

const PageTitle = ({
  text,
  subTitle = null,
  leftComponent = null,
  leftContainerStyle = {},
  rightComponent = null,
  rightContainerStyle = {},
}) => {
  const navigation = useNavigation();
  const selectedForm = FormState.useState((s) => s.form);
  const currentValues = FormState.useState((s) => s.currentValues);
  const cascades = FormState.useState((s) => s.cascades);
  const forms = selectedForm?.json ? JSON.parse(selectedForm.json) : {};
  const { dpName } = generateDataPointName(forms, currentValues, cascades);

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  subTitle = subTitle === 'formPage' ? dpName : subTitle;

  return (
    <Header
      leftComponent={leftComponent}
      leftContainerStyle={leftContainerStyle}
      rightComponent={rightComponent}
      rightContainerStyle={rightContainerStyle}
      backgroundColor="#f3f4f6"
      statusBarProps={{
        backgroundColor: '#171717',
      }}
      containerStyle={styles.container}
      testID="base-layout-page-title"
    >
      {!leftComponent && <BackButton navigation={navigation} />}
      {subTitle ? (
        <View>
          <Text h4Style={styles.title} testID="page-title" numberOfLines={1} h4>
            {text}
          </Text>
          <Text testID="page-subtitle" style={styles.subTitle} numberOfLines={1}>
            {subTitle}
          </Text>
        </View>
      ) : (
        <Text h4Style={styles.onlyTitle} testID="page-title" h4>
          {text}
        </Text>
      )}
      {rightComponent === null && (
        <Button type="clear" testID="more-options-button" onPress={handleSettingsPress}>
          <Icon name="ellipsis-vertical" size={18} />
        </Button>
      )}
    </Header>
  );
};

const styles = StyleSheet.create({
  container: {
    minheight: 78,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  onlyTitle: {
    paddingTop: 4,
    fontSize: 18,
    textAlign: 'center',
  },
  subTitle: {
    fontWeight: 400,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PageTitle;
