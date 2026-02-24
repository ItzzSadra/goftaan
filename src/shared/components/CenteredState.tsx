import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type CenteredStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export const CenteredState = ({ title, description, action }: CenteredStateProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: typography.regular,
  },
});
