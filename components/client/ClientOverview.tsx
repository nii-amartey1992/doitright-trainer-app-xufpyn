
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Client } from '@/utils/supabase';
import { IconSymbol } from '@/components/IconSymbol';

type Props = {
  client: Client;
};

export default function ClientOverview({ client }: Props) {
  const InfoRow = ({ icon, label, value, iosIcon, androidIcon }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <IconSymbol
          ios_icon_name={iosIcon}
          android_material_icon_name={androidIcon}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.card}>
          <InfoRow
            iosIcon="envelope.fill"
            androidIcon="email"
            label="Email"
            value={client.email}
          />
          <InfoRow
            iosIcon="phone.fill"
            androidIcon="phone"
            label="Phone"
            value={client.phone}
          />
          <InfoRow
            iosIcon="calendar"
            androidIcon="calendar_today"
            label="Date of Birth"
            value={client.dob}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Physical Stats</Text>
        <View style={styles.card}>
          <InfoRow
            iosIcon="figure.stand"
            androidIcon="accessibility"
            label="Gender"
            value={client.gender}
          />
          <InfoRow
            iosIcon="ruler"
            androidIcon="straighten"
            label="Height"
            value={client.height_cm ? `${client.height_cm} cm` : null}
          />
          <InfoRow
            iosIcon="scalemass"
            androidIcon="monitor_weight"
            label="Weight"
            value={client.weight_kg ? `${client.weight_kg} kg` : null}
          />
          <InfoRow
            iosIcon="percent"
            androidIcon="percent"
            label="Body Fat"
            value={client.bodyfat_percentage ? `${client.bodyfat_percentage}%` : null}
          />
          <InfoRow
            iosIcon="target"
            androidIcon="flag"
            label="Target Weight"
            value={client.target_weight_kg ? `${client.target_weight_kg} kg` : null}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Details</Text>
        <View style={styles.card}>
          <InfoRow
            iosIcon="flame.fill"
            androidIcon="local_fire_department"
            label="Activity Level"
            value={client.activity_level?.replace('_', ' ')}
          />
          <InfoRow
            iosIcon="flag.fill"
            androidIcon="emoji_events"
            label="Goals"
            value={client.goals?.replace('_', ' ')}
          />
          <InfoRow
            iosIcon="calendar.badge.clock"
            androidIcon="event"
            label="Training Days"
            value={client.weekly_training_days ? `${client.weekly_training_days} days/week` : null}
          />
          <InfoRow
            iosIcon="clock.fill"
            androidIcon="schedule"
            label="Session Duration"
            value={client.session_duration_minutes ? `${client.session_duration_minutes} minutes` : null}
          />
          <InfoRow
            iosIcon="star.fill"
            androidIcon="star"
            label="Experience"
            value={client.training_experience}
          />
          <InfoRow
            iosIcon="location.fill"
            androidIcon="location_on"
            label="Location"
            value={client.training_location}
          />
        </View>
      </View>

      {client.injuries && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Injuries / Limitations</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{client.injuries}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Preferences</Text>
        <View style={styles.card}>
          <InfoRow
            iosIcon="leaf.fill"
            androidIcon="restaurant"
            label="Diet Type"
            value={client.diet_type}
          />
          {client.allergies && client.allergies.length > 0 && (
            <InfoRow
              iosIcon="exclamationmark.triangle.fill"
              androidIcon="warning"
              label="Allergies"
              value={client.allergies.join(', ')}
            />
          )}
          {client.disliked_foods && client.disliked_foods.length > 0 && (
            <InfoRow
              iosIcon="hand.raised.fill"
              androidIcon="block"
              label="Disliked Foods"
              value={client.disliked_foods.join(', ')}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
