import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/config";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.92;

export default function Dashboard() {
  const { userToken, userInfo, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load Montserrat fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      console.log(
        "Fetching forms with token:",
        userToken ? "Token exists" : "No token"
      );

      if (!userToken) {
        console.error("No auth token available");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/forms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": userToken,
        },
      });

      const data = await response.json();
      console.log("Forms API response status:", response.status);

      if (response.status === 401) {
        console.error("Authentication error: Token invalid or expired");
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
          [{ text: "OK", onPress: () => logout() }]
        );
        return;
      }

      if (response.ok) {
        console.log(`Successfully fetched ${data.forms?.length || 0} forms`);
        setForms(data.forms || []);
      } else {
        console.error("Failed to fetch forms:", data.message);
        Alert.alert("Error", data.message || "Failed to load forms");
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      Alert.alert("Error", "An unexpected error occurred while loading forms");
    } finally {
      setLoading(false);
    }
  };

  const navigateToCreateForm = () => {
    router.push("/home/create-form");
  };

  const navigateToFormDetails = (formId) => {
    router.push(`/home/form-details?id=${formId}`);
  };

  const navigateToProfile = () => {
    router.push("/profile");
  };

  const renderFormItem = ({ item }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const responseCount = item.responseCount || 0;
    const statusColor = responseCount > 0 ? "#4CAF50" : "#FFA000";
    const statusText = responseCount > 0 ? "Active" : "Pending";

    return (
      <TouchableOpacity
        style={styles.formCard}
        onPress={() => navigateToFormDetails(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.formCardHeader}>
          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          <Text style={styles.formDate}>{formattedDate}</Text>
        </View>

        <Text style={styles.formDescription} numberOfLines={2}>
          {item.description || "No description provided"}
        </Text>

        <View style={styles.divider} />

        <View style={styles.formCardFooter}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#4a6da7"
              />
              <Text style={styles.statText}>
                {item.fields?.length || 0} fields
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#4a6da7" />
              <Text style={styles.statText}>{responseCount} responses</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              // Copy to clipboard or share functionality
              Alert.alert(
                "Share Form",
                `Public link: ${API_URL}${item.publicLink}`,
                [
                  { text: "Copy", onPress: () => console.log("Link copied") },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            <Ionicons name="share-social-outline" size={16} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HR Recruitment</Text>
          <Text style={styles.headerSubtitle}>Dashboard</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => fetchForms()}
          >
            <Ionicons name="refresh-outline" size={24} color="#4a6da7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={navigateToProfile}
          >
            <Ionicons name="person-circle-outline" size={36} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient
        colors={["#4a6da7", "#6C8AC6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.welcomeBanner}
      >
        <View style={styles.welcomeContent}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome, {userInfo?.name?.split(" ")[0] || "User"}
            </Text>
            <Text style={styles.welcomeDescription}>
              Manage your recruitment forms and candidate applications
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="documents-outline" size={24} color="#2A3453" />
            <Text style={styles.sectionTitle}>Your Forms</Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={navigateToCreateForm}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Form</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color="#4a6da7"
              style={styles.loader}
            />
            <Text style={styles.loadingText}>Loading your forms...</Text>
          </View>
        ) : forms.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require("../../assets/empty-state.png")}
              style={styles.emptyStateImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyStateText}>No forms created yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first recruitment form to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={navigateToCreateForm}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>
                Create Your First Form
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={forms}
            keyExtractor={(item) => item._id}
            renderItem={renderFormItem}
            contentContainerStyle={styles.formsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFD",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8F5",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3453",
    fontFamily: "Montserrat_700Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6A7290",
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  profileButton: {
    marginLeft: 8,
  },
  welcomeBanner: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "Montserrat_700Bold",
  },
  welcomeDescription: {
    fontSize: 14,
    color: "#E8EDF8",
    marginTop: 6,
    fontFamily: "Montserrat_400Regular",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: "#ffffff",
    marginLeft: 4,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A3453",
    marginLeft: 8,
    fontFamily: "Montserrat_600SemiBold",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: "#ffffff",
    marginLeft: 6,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
  formsList: {
    paddingBottom: 20,
    alignItems: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: cardWidth,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  formTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A3453",
    flex: 1,
    fontFamily: "Montserrat_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
  },
  formDate: {
    fontSize: 12,
    color: "#6A7290",
    fontFamily: "Montserrat_400Regular",
  },
  formDescription: {
    fontSize: 14,
    color: "#6A7290",
    marginBottom: 16,
    fontFamily: "Montserrat_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#E1E8F5",
    marginBottom: 16,
  },
  formCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    color: "#6A7290",
    marginLeft: 6,
    fontFamily: "Montserrat_500Medium",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: "#ffffff",
    marginLeft: 4,
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6A7290",
    fontFamily: "Montserrat_400Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A3453",
    marginBottom: 8,
    fontFamily: "Montserrat_600SemiBold",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6A7290",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Montserrat_400Regular",
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateButtonText: {
    color: "#ffffff",
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
  },
});
