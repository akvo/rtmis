import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },
  questionGroupContainer: {
    marginBottom: 20,
  },
  fieldGroupHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderColor: 'grey',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  fieldGroupName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  fieldGroupDescContainer: {
    backgroundColor: '#e5e7eb',
  },
  fieldGroupDescription: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    fontSize: 14,
  },
  questionContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  validationErrorText: {
    paddingHorizontal: 10,
    marginTop: -15,
    color: 'red',
    fontStyle: 'italic',
  },
  fieldLabelContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  fieldRequiredIcon: {
    color: 'red',
    paddingLeft: 10,
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
    fontWeight: 600,
    fontSize: 14,
  },
  inputFieldContainer: {
    paddingHorizontal: 10,
    borderColor: 'grey',
    borderWidth: 0.5,
    borderRadius: 5,
    borderBottomWidth: 0.5,
  },
  radioFieldContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 5,
    marginBottom: 0,
  },
  autoFieldContainer: {
    paddingHorizontal: 10,
    borderColor: 'grey',
    borderWidth: 0.5,
    borderRadius: 5,
    borderBottomWidth: 0.5,
    backgroundColor: '#f2f2f2',
  },
  radioFieldText: {
    fontWeight: 'normal',
  },
  optionContainer: {
    marginBottom: 25,
  },
  multipleOptionContainer: {
    marginBottom: 25,
  },
  dropdownField: {
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderColor: 'grey',
    borderWidth: 0.5,
    borderRadius: 5,
  },
  dropdownSelectedList: {
    marginLeft: 10,
    marginRight: 0,
  },
  formNavigationButton: {
    // backgroundColor:'red',
    borderTopColor: 'grey',
    borderTopWidth: 0.5,
    borderBottomWidth: 0,
  },
  formNavigationIcon: {
    paddingTop: 9,
    paddingBottom: 10,
  },
  formNavigationTitle: {
    paddingTop: 9,
    paddingBottom: 10,
    color: 'grey',
    fontWeight: 'normal',
    fontSize: 14,
    marginRight: -10,
    marginLeft: -10,
  },
  formNavigationGroupCount: {
    paddingTop: 13,
    paddingBottom: 10,
    color: 'grey',
    fontWeight: 'normal',
    fontSize: 14,
    marginRight: -10,
    marginLeft: -10,
  },
  inputGeoContainer: {
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 18,
  },
  questionGroupListContainer: {
    paddingVertical: 24,
    flex: 1,
    width: '100%',
  },
  divider: {
    paddingHorizontal: 20,
    marginVertical: 7,
  },
  questionGroupListFormTitle: {
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  questionGroupListDataPointName: {
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 4,
  },
  questionGroupListItemWrapper: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    paddingVertical: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  questionGroupListItemActive: {
    backgroundColor: '#E9E9E9',
  },
  questionGroupListItemIcon: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  questionGroupListItemName: {
    marginLeft: 10,
  },
  questionGroupListItemNameActive: {
    fontWeight: 'bold',
  },
  cascadeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 25,
  },
  cascadeValues: {
    opacity: 0,
    marginBottom: -16,
  },
  geoButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  errorText: {
    color: 'red',
    fontStyle: 'italic',
  },
});
