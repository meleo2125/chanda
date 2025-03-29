import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Share,
  Alert,
  Linking,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/config";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { LinearGradient } from "expo-linear-gradient";

// Calculate card dimensions
const COLUMN_COUNT = 3;
const CARD_MARGIN = 8;
const screenWidth = Dimensions.get("window").width;
const cardWidth =
  (screenWidth - 40 - (COLUMN_COUNT - 1) * CARD_MARGIN) / COLUMN_COUNT;

export default function FormDetails() {
  const { userToken } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [sortBy, setSortBy] = useState("final_score"); // Default sort by final score
  const [hrRequirements, setHrRequirements] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  // For the detail modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // For sort options dropdown
  const [showSortOptions, setShowSortOptions] = useState(false);

  // For filtering
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minSkills: 0,
    minExp: 0,
    minEdu: 0,
    minOverall: 0,
    searchTerm: "",
    educationLevel: "",
  });

  // For education dropdown
  const [showEducationDropdown, setShowEducationDropdown] = useState(false);
  const educationLevels = [
    "Any",
    "High School",
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
  ];

  // Load Montserrat fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    fetchFormDetails();
    fetchSubmissions();
  }, [sortBy]); // Refetch when sort changes

  // Apply filters and update filtered submissions
  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  // Filter submissions based on current filter settings
  const applyFilters = () => {
    if (!submissions.length) {
      setFilteredSubmissions([]);
      return;
    }

    let result = [...submissions];

    // Apply score filters
    result = result.filter((item) => {
      // Skip submissions without AI evaluation
      if (!item.aiEvaluation) return true;

      const { breakdown } = item.aiEvaluation;

      // Check minimum scores
      if (breakdown.skills_score < filters.minSkills) return false;
      if (breakdown.experience_score < filters.minExp) return false;
      if (breakdown.education_score < filters.minEdu) return false;
      if (item.aiEvaluation.final_score < filters.minOverall) return false;

      return true;
    });

    // Apply education level filter if present and not "Any"
    if (filters.educationLevel && filters.educationLevel !== "Any") {
      result = result.filter((item) => {
        // Find education field in responses
        const educationResponse = item.responses.find(
          (resp) =>
            getFieldLabel(resp.fieldId).toLowerCase().includes("education") ||
            getFieldLabel(resp.fieldId).toLowerCase().includes("degree")
        );

        if (!educationResponse) return false;

        const candidateEducation = educationResponse.value.toLowerCase();
        const filterLevel = filters.educationLevel.toLowerCase();

        // Education hierarchy check
        const levels = {
          "high school": 1,
          associate: 2,
          bachelor: 3,
          master: 4,
          phd: 5,
          doctorate: 5,
        };

        // Get candidate's highest education level
        let candidateLevel = 0;
        Object.entries(levels).forEach(([key, value]) => {
          if (candidateEducation.includes(key)) {
            candidateLevel = Math.max(candidateLevel, value);
          }
        });

        // Get filter education level
        let filterValue = 0;
        Object.entries(levels).forEach(([key, value]) => {
          if (filterLevel.includes(key)) {
            filterValue = value;
          }
        });

        // Pass if candidate education is at or above the filter level
        return candidateLevel >= filterValue;
      });
    }

    // Apply search term filter if present
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter((item) => {
        // Search in candidate name, email, and phone
        const nameResponse = item.responses.find((resp) =>
          getFieldLabel(resp.fieldId).toLowerCase().includes("name")
        );
        const emailResponse = item.responses.find((resp) =>
          getFieldLabel(resp.fieldId).toLowerCase().includes("email")
        );
        const phoneResponse = item.responses.find((resp) =>
          getFieldLabel(resp.fieldId).toLowerCase().includes("phone")
        );

        const name = nameResponse ? nameResponse.value.toLowerCase() : "";
        const email = emailResponse ? emailResponse.value.toLowerCase() : "";
        const phone = phoneResponse ? phoneResponse.value.toLowerCase() : "";

        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower)
        );
      });
    }

    setFilteredSubmissions(result);
  };

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/forms/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": userToken,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setForm(data.form);
        if (data.form.jobDescription) {
          setJobDescription(data.form.jobDescription);
        } else {
          // Try to fetch job description from a separate endpoint if available
          try {
            const jobResponse = await fetch(
              `${API_URL}/api/forms/${id}/job-description`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-auth-token": userToken,
                },
              }
            );

            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              if (jobData.jobDescription) {
                setJobDescription(jobData.jobDescription);
              }
            }
          } catch (jobError) {
            console.error("Error fetching job description:", jobError);
          }
        }
      } else {
        Alert.alert("Error", data.message || "Failed to fetch form details");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching form details:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const response = await fetch(
        `${API_URL}/api/submissions/${id}?sortBy=${sortBy}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSubmissions(data.submissions || []);
        setFilteredSubmissions(data.submissions || []);
        if (data.form && data.form.hrRequirements) {
          setHrRequirements(data.form.hrRequirements);
        }
      } else {
        console.error("Failed to fetch submissions:", data.message);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Open the candidate detail modal
  const openCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setModalVisible(true);
  };

  // Close the candidate detail modal
  const closeCandidateDetails = () => {
    setModalVisible(false);
    setSelectedCandidate(null);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      minSkills: 0,
      minExp: 0,
      minEdu: 0,
      minOverall: 0,
      searchTerm: "",
      educationLevel: "",
    });
  };

  const shareFormLink = async () => {
    try {
      const publicLink = `${API_URL}${form.publicLink}`;

      // Copy to clipboard
      await Clipboard.setStringAsync(publicLink);

      // Share dialog
      await Share.share({
        message: `Apply for our job position by filling out this form: ${publicLink}`,
        url: publicLink,
        title: form.title,
      });

      Alert.alert("Success", "Form link copied to clipboard and shared");
    } catch (error) {
      console.error("Error sharing form link:", error);
      Alert.alert("Error", "Failed to share form link");
    }
  };

  const openResumeLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error("Error opening URL:", err);
        Alert.alert("Error", "Could not open resume link");
      });
    } else {
      Alert.alert("Info", "No resume available for this candidate");
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to get field value from responses
  const getFieldValue = (responses, fieldName) => {
    const response = responses.find((resp) =>
      getFieldLabel(resp.fieldId)
        .toLowerCase()
        .includes(fieldName.toLowerCase())
    );
    return response ? response.value : "";
  };

  // Helper function to calculate metrics from submissions
  const calculateMetrics = () => {
    if (!submissions.length) {
      return { avgScore: 0, topScore: 0, qualified: 0 };
    }

    let total = 0;
    let top = 0;
    let qualified = 0;

    submissions.forEach((sub) => {
      if (sub.aiEvaluation && sub.aiEvaluation.final_score) {
        const score = sub.aiEvaluation.final_score;
        total += score;
        if (score > top) top = score;
        if (score >= 70) qualified++;
      }
    });

    return {
      avgScore: submissions.length ? Math.round(total / submissions.length) : 0,
      topScore: top,
      qualified,
    };
  };

  // Helper function to find field label by ID
  const getFieldLabel = (fieldId) => {
    if (!form) return "";
    const field = form.fields.find((f) => f.id === fieldId);
    return field ? field.label : "Unknown Field";
  };

  // Helper function to get sort label
  const getSortLabel = (sortKey) => {
    const labels = {
      final_score: "Overall Score",
      skills_score: "Skills",
      experience_score: "Experience",
      education_score: "Education",
      notice_period_score: "Notice Period",
      overall_profile_score: "Overall Profile",
      achievements_score: "Achievements",
      certificates_score: "Certificates",
      cultural_fit_score: "Cultural Fit",
      newest: "Newest",
    };

    return labels[sortKey] || "Overall Score";
  };

  // Render a submission card
  const renderSubmissionItem = ({ item, index }) => {
    // Get score color based on AI evaluation
    const getScoreColor = (score) => {
      if (score >= 80) return "#4CAF50"; // Green
      if (score >= 60) return "#2196F3"; // Blue
      if (score >= 40) return "#FF9800"; // Orange
      return "#F44336"; // Red
    };

    const hasAiScore =
      item.aiEvaluation && typeof item.aiEvaluation.final_score !== "undefined";

    const scoreColor = hasAiScore
      ? getScoreColor(item.aiEvaluation.final_score)
      : "#757575";

    // Get candidate info from responses
    const nameResponse =
      item.responses &&
      item.responses.find((resp) =>
        getFieldLabel(resp.fieldId).toLowerCase().includes("name")
      );
    const emailResponse =
      item.responses &&
      item.responses.find((resp) =>
        getFieldLabel(resp.fieldId).toLowerCase().includes("email")
      );
    const phoneResponse =
      item.responses &&
      item.responses.find((resp) =>
        getFieldLabel(resp.fieldId).toLowerCase().includes("phone")
      );

    const candidateName = nameResponse
      ? nameResponse.value
      : "Unknown Candidate";
    const candidateEmail = emailResponse
      ? emailResponse.value
      : "No email provided";
    const candidatePhone = phoneResponse
      ? phoneResponse.value
      : "No phone provided";

    // Check if resume exists
    const hasResume = item.resumeUrl && item.resumeUrl.trim() !== "";

    // Calculate margin for even spacing in a 3-column grid
    // Last item in each row shouldn't have right margin
    const isLastInRow = (index + 1) % COLUMN_COUNT === 0;
    const cardStyle = {
      ...styles.candidateCard,
      marginRight: isLastInRow ? 0 : CARD_MARGIN,
      width: cardWidth,
    };

    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => openCandidateDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {hasAiScore ? item.aiEvaluation.final_score : "-"}
            </Text>
          </View>
          {hasResume && (
            <View style={styles.resumeBadge}>
              <Ionicons name="document-text" size={16} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.candidateNameContainer}>
          <Text style={styles.candidateName} numberOfLines={1}>
            {candidateName}
          </Text>
        </View>
        <Text style={styles.candidateEmail} numberOfLines={1}>
          {candidateEmail}
        </Text>

        {hasAiScore && item.aiEvaluation.breakdown && (
          <View style={styles.scoreBreakdown}>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreLabel}>Skills</Text>
              <Text style={styles.miniScoreValue}>
                {item.aiEvaluation.breakdown.skills_score || 0}
              </Text>
            </View>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreLabel}>Exp</Text>
              <Text style={styles.miniScoreValue}>
                {item.aiEvaluation.breakdown.experience_score || 0}
              </Text>
            </View>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreLabel}>Edu</Text>
              <Text style={styles.miniScoreValue}>
                {item.aiEvaluation.breakdown.education_score || 0}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => openCandidateDetails(item)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading fonts...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading form details...</Text>
      </View>
    );
  }

  // Render the filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Candidates</Text>
              <TouchableOpacity
                style={styles.filterModalCloseButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalContent}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#777"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search candidates..."
                  value={filters.searchTerm}
                  onChangeText={(text) =>
                    setFilters({ ...filters, searchTerm: text })
                  }
                  placeholderTextColor="#999"
                />
                {filters.searchTerm ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setFilters({ ...filters, searchTerm: "" })}
                  >
                    <Ionicons name="close-circle" size={20} color="#777" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Education level dropdown */}
              <View style={styles.educationContainer}>
                <Text style={styles.educationLabel}>Education Level:</Text>
                <TouchableOpacity
                  style={styles.educationDropdown}
                  onPress={() =>
                    setShowEducationDropdown(!showEducationDropdown)
                  }
                >
                  <Text style={styles.educationDropdownText}>
                    {filters.educationLevel || "Any"}
                  </Text>
                  <Ionicons
                    name={showEducationDropdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#777"
                    style={{ position: "absolute", right: 12, top: 12 }}
                  />
                </TouchableOpacity>

                {showEducationDropdown && (
                  <View style={styles.educationOptions}>
                    {educationLevels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={styles.educationOption}
                        onPress={() => {
                          setFilters({ ...filters, educationLevel: level });
                          setShowEducationDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.educationOptionText,
                            filters.educationLevel === level && {
                              color: "#4a6da7",
                              fontFamily: "Montserrat_600SemiBold",
                            },
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.filterSectionTitle}>Minimum Scores</Text>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Skills: {filters.minSkills}
                </Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderMin}>0</Text>
                  <View style={styles.sliderTrack}>
                    {[0, 20, 40, 60, 80].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.sliderTick,
                          filters.minSkills >= value && styles.sliderTickActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, minSkills: value })
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.sliderMax}>100</Text>
                </View>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Experience: {filters.minExp}
                </Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderMin}>0</Text>
                  <View style={styles.sliderTrack}>
                    {[0, 20, 40, 60, 80].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.sliderTick,
                          filters.minExp >= value && styles.sliderTickActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, minExp: value })
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.sliderMax}>100</Text>
                </View>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Education: {filters.minEdu}
                </Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderMin}>0</Text>
                  <View style={styles.sliderTrack}>
                    {[0, 20, 40, 60, 80].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.sliderTick,
                          filters.minEdu >= value && styles.sliderTickActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, minEdu: value })
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.sliderMax}>100</Text>
                </View>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Overall: {filters.minOverall}
                </Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderMin}>0</Text>
                  <View style={styles.sliderTrack}>
                    {[0, 20, 40, 60, 80].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.sliderTick,
                          filters.minOverall >= value &&
                            styles.sliderTickActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, minOverall: value })
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.sliderMax}>100</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => {
                  resetFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.resetFilterText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFilterText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render the candidate detail modal
  const renderCandidateModal = () => {
    if (!selectedCandidate) return null;

    const hasAiScore =
      selectedCandidate.aiEvaluation &&
      typeof selectedCandidate.aiEvaluation.final_score !== "undefined";

    // Find the candidate's name from responses
    const nameResponse = selectedCandidate.responses.find((resp) =>
      getFieldLabel(resp.fieldId).toLowerCase().includes("name")
    );
    const candidateName = nameResponse ? nameResponse.value : "Candidate";

    // Get score color
    const getScoreColor = (score) => {
      if (score >= 80) return "#4CAF50"; // Green
      if (score >= 60) return "#2196F3"; // Blue
      if (score >= 40) return "#FF9800"; // Orange
      return "#F44336"; // Red
    };

    const scoreColor = hasAiScore
      ? getScoreColor(selectedCandidate.aiEvaluation.final_score)
      : "#757575";

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeCandidateDetails}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <LinearGradient
              colors={["#4a6da7", "#6989CC"]}
              style={styles.modalHeader}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeCandidateDetails}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{candidateName}</Text>
              {hasAiScore && (
                <View
                  style={[
                    styles.modalScoreBadge,
                    { backgroundColor: scoreColor },
                  ]}
                >
                  <Text style={styles.modalScoreText}>
                    {selectedCandidate.aiEvaluation.final_score}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              {/* Candidate Basic Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Basic Information</Text>
                {selectedCandidate.responses &&
                  selectedCandidate.responses.map((response, idx) => (
                    <View key={idx} style={styles.responseRow}>
                      <Text style={styles.responseLabel}>
                        {getFieldLabel(response.fieldId)}:
                      </Text>
                      <Text style={styles.responseValue}>{response.value}</Text>
                    </View>
                  ))}
                {selectedCandidate.submittedAt && (
                  <Text style={styles.submissionDate}>
                    Applied:{" "}
                    {new Date(
                      selectedCandidate.submittedAt
                    ).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {/* Resume Section */}
              {selectedCandidate.resumeUrl && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Resume</Text>
                  <TouchableOpacity
                    style={styles.viewResumeButton}
                    onPress={() => openResumeLink(selectedCandidate.resumeUrl)}
                  >
                    <Ionicons name="document-text" size={20} color="#fff" />
                    <Text style={styles.viewResumeText}>View Resume</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Evaluation Section */}
              {hasAiScore && selectedCandidate.aiEvaluation && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>AI Evaluation</Text>

                  {/* Score summary */}
                  <View style={styles.scoreGrid}>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Overall</Text>
                      <Text
                        style={[styles.scoreGridValue, { color: scoreColor }]}
                      >
                        {selectedCandidate.aiEvaluation.final_score}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Skills</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .skills_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .skills_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Experience</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .experience_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .experience_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Education</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .education_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .education_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Notice Period</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .notice_period_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .notice_period_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Achievements</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .achievements_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .achievements_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Certifications</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .certificates_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .certificates_score
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.scoreGridItem}>
                      <Text style={styles.scoreGridLabel}>Cultural Fit</Text>
                      <Text style={styles.scoreGridValue}>
                        {selectedCandidate.aiEvaluation.breakdown &&
                        selectedCandidate.aiEvaluation.breakdown
                          .cultural_fit_score !== undefined
                          ? selectedCandidate.aiEvaluation.breakdown
                              .cultural_fit_score
                          : 0}
                      </Text>
                    </View>
                  </View>

                  {/* Detailed Analysis */}
                  {selectedCandidate.aiEvaluation.detailed_reasoning && (
                    <View style={styles.analysisSection}>
                      <Text style={styles.analysisSectionTitle}>
                        Detailed Analysis
                      </Text>

                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Skills:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .skills_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Experience:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .experience_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Education:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .education_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Notice Period:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .notice_period_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Achievements:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .achievements_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>
                          Certifications:
                        </Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .certificates_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Cultural Fit:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .cultural_fit_analysis || "No analysis available."}
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>Overall:</Text>
                        <Text style={styles.analysisText}>
                          {selectedCandidate.aiEvaluation.detailed_reasoning
                            .overall_analysis || "No analysis available."}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Candidate Detail Modal */}
      {renderCandidateModal()}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Form Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formDetailsContainer}>
        <View style={styles.formHeader}>
          <View>
            <Text style={styles.formTitle}>{form.title}</Text>
            <Text style={styles.formDate}>
              Created on {formatDate(form.createdAt)}
            </Text>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={shareFormLink}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {form.description && (
          <Text style={styles.formDescription} numberOfLines={2}>
            {form.description}
          </Text>
        )}

        {jobDescription && (
          <TouchableOpacity
            style={styles.jobDescriptionContainer}
            onPress={() => Alert.alert("Job Description", jobDescription)}
          >
            <Text style={styles.jobDescriptionLabel}>Job Description:</Text>
            <Text style={styles.jobDescriptionText} numberOfLines={2}>
              {jobDescription}
            </Text>
            <Text style={styles.jobDescriptionMore}>
              Tap to view full description
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.formStatsContainer}>
          <View style={styles.formStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{form.fields.length}</Text>
              <Text style={styles.statLabel}>Fields</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{submissions.length}</Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>

            {submissions.length > 0 && (
              <>
                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {calculateMetrics().avgScore}
                  </Text>
                  <Text style={styles.statLabel}>Avg Score</Text>
                </View>
              </>
            )}
          </View>

          {hrRequirements && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Job Requirements:</Text>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Experience:</Text>
                <Text style={styles.requirementValue}>
                  {hrRequirements.experience
                    ? `${hrRequirements.experience} years`
                    : "Not specified"}
                </Text>
              </View>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Education:</Text>
                <Text style={styles.requirementValue}>
                  {hrRequirements.education || "Not specified"}
                </Text>
              </View>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Skills:</Text>
                <Text style={styles.requirementValue} numberOfLines={2}>
                  {hrRequirements.skills && Array.isArray(hrRequirements.skills)
                    ? hrRequirements.skills.join(", ")
                    : "Not specified"}
                </Text>
              </View>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Location:</Text>
                <Text style={styles.requirementValue}>
                  {typeof hrRequirements.location === "object"
                    ? hrRequirements.location.remote_option
                      ? "Remote"
                      : `${hrRequirements.location.city || ""} ${
                          hrRequirements.location.state || ""
                        } ${hrRequirements.location.country || ""}`.trim() ||
                        "Not specified"
                    : hrRequirements.location || "Remote/Flexible"}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.submissionsContainer}>
          <View style={styles.submissionsHeader}>
            <Text style={styles.sectionTitle}>Candidate Submissions</Text>

            <View style={styles.headerActions}>
              {hrRequirements && (
                <TouchableOpacity
                  style={styles.sortDropdownButton}
                  onPress={() => setShowSortOptions(!showSortOptions)}
                >
                  <Text style={styles.sortDropdownText}>
                    Sort by: {getSortLabel(sortBy)}
                  </Text>
                  <Ionicons
                    name={showSortOptions ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#4a6da7"
                  />
                  {showSortOptions && (
                    <View style={styles.sortOptions}>
                      <ScrollView>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "final_score" && styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("final_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "final_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Overall Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "skills_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("skills_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "skills_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Skills Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "experience_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("experience_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "experience_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Experience Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "education_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("education_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "education_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Education Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "notice_period_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("notice_period_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "notice_period_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Notice Period Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "overall_profile_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("overall_profile_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "overall_profile_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Overall Profile Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "achievements_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("achievements_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "achievements_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Achievements Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "certificates_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("certificates_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "certificates_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Certificates Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "cultural_fit_score" &&
                              styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("cultural_fit_score");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "cultural_fit_score" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Cultural Fit Score
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === "newest" && styles.activeSortOption,
                          ]}
                          onPress={() => {
                            setSortBy("newest");
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              sortBy === "newest" &&
                                styles.activeSortOptionText,
                            ]}
                          >
                            Newest
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setFilterModalVisible(!filterModalVisible);
                  setFilterMenuOpen(false);
                }}
              >
                <Ionicons name="filter" size={20} color="#4a6da7" />
                {Object.values(filters).some((v) => v !== 0 && v !== "") && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.candidatesContainer}>
              {loadingSubmissions ? (
                <ActivityIndicator
                  size="large"
                  color="#4a6da7"
                  style={styles.submissionsLoader}
                />
              ) : filteredSubmissions.length === 0 ? (
                <View style={styles.emptySubmissions}>
                  <Ionicons
                    name="document-text-outline"
                    size={64}
                    color="#c5c5c5"
                  />
                  <Text style={styles.emptySubmissionsText}>
                    No submissions found
                  </Text>
                  <Text style={styles.emptySubmissionsSubtext}>
                    {submissions.length > 0
                      ? "Try adjusting your filters to see more results"
                      : "Share the form link with candidates to receive applications"}
                  </Text>
                  {submissions.length === 0 && (
                    <TouchableOpacity
                      style={styles.shareEmptyButton}
                      onPress={shareFormLink}
                    >
                      <Ionicons name="share-social" size={18} color="#fff" />
                      <Text style={styles.shareEmptyButtonText}>
                        Share Form Link
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <FlatList
                  data={filteredSubmissions}
                  keyExtractor={(item) => item._id}
                  renderItem={renderSubmissionItem}
                  numColumns={3}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.submissionsList}
                  columnWrapperStyle={styles.submissionsRow}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    fontFamily: "Montserrat_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
    fontFamily: "Montserrat_400Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  headerTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
  },
  backButton: {
    padding: 4,
  },
  formDetailsContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  formTitle: {
    fontSize: 20,
    color: "#333",
    marginBottom: 4,
    fontFamily: "Montserrat_700Bold",
  },
  formDate: {
    fontSize: 14,
    color: "#777",
    fontFamily: "Montserrat_400Regular",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  shareButtonText: {
    color: "#ffffff",
    marginLeft: 4,
    fontFamily: "Montserrat_600SemiBold",
  },
  formDescription: {
    fontSize: 16,
    color: "#555",
    marginTop: 16,
    marginBottom: 16,
    fontFamily: "Montserrat_400Regular",
  },
  formStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  formStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "48%",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    color: "#4a6da7",
    fontFamily: "Montserrat_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    fontFamily: "Montserrat_400Regular",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e1e1e1",
  },
  requirementsContainer: {
    backgroundColor: "#f5f7fa",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    width: "48%",
  },
  requirementsTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "Montserrat_600SemiBold",
  },
  requirementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  requirementLabel: {
    fontSize: 14,
    color: "#555",
    fontFamily: "Montserrat_500Medium",
    width: "40%",
  },
  requirementValue: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Montserrat_400Regular",
    width: "60%",
  },
  educationContainer: {
    marginTop: 16,
  },
  educationLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    fontFamily: "Montserrat_500Medium",
  },
  educationDropdown: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  educationDropdownText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Montserrat_400Regular",
  },
  educationOptions: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  educationOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  educationOptionText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Montserrat_400Regular",
  },
  submissionsContainer: {
    flex: 1,
    padding: 16,
  },
  submissionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 16,
    fontFamily: "Montserrat_600SemiBold",
  },
  submissionsLoader: {
    marginTop: 40,
  },
  emptySubmissions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptySubmissionsText: {
    fontSize: 18,
    color: "#333",
    marginTop: 16,
    fontFamily: "Montserrat_600SemiBold",
  },
  emptySubmissionsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    fontFamily: "Montserrat_400Regular",
  },
  shareEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareEmptyButtonText: {
    color: "#ffffff",
    marginLeft: 8,
    fontFamily: "Montserrat_600SemiBold",
  },
  submissionsRow: {
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  submissionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  submissionsRow: {
    justifyContent: "flex-start",
    marginBottom: 0,
  },
  candidateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    width: cardWidth,
    marginBottom: 16,
    marginRight: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: "#757575",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Montserrat_700Bold",
  },
  resumeBadge: {
    backgroundColor: "#4a6da7",
    padding: 4,
    borderRadius: 4,
  },
  candidateNameContainer: {
    marginBottom: 4,
  },
  candidateName: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
  },
  candidateEmail: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
    fontFamily: "Montserrat_400Regular",
  },
  scoreBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    marginBottom: 12,
  },
  miniScore: {
    alignItems: "center",
  },
  miniScoreLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
    fontFamily: "Montserrat_500Medium",
  },
  miniScoreValue: {
    fontSize: 14,
    color: "#4a6da7",
    fontFamily: "Montserrat_700Bold",
  },
  viewDetailsButton: {
    backgroundColor: "#4a6da7",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#ffffff",
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
  sortingControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: "#777",
    marginRight: 8,
    fontFamily: "Montserrat_500Medium",
  },
  sortButton: {
    padding: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    marginRight: 4,
  },
  activeSortButton: {
    borderColor: "#4a6da7",
    backgroundColor: "#4a6da7",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#4a6da7",
    fontFamily: "Montserrat_500Medium",
  },
  activeSortOptionText: {
    color: "#ffffff",
  },
  filterButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    position: "relative",
    zIndex: 10,
    marginLeft: 10,
  },
  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff6b6b",
  },
  contentRow: {
    flexDirection: "row",
    flex: 1,
  },
  candidatesContainer: {
    flex: 1,
  },

  // Filter UI styles
  filterContainer: {
    width: "30%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  filterTitle: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
  },
  resetFilterButton: {
    padding: 4,
  },
  resetFilterText: {
    fontSize: 14,
    color: "#4a6da7",
    fontFamily: "Montserrat_500Medium",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: "Montserrat_400Regular",
  },
  clearSearchButton: {
    padding: 4,
  },
  filterSectionTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    fontFamily: "Montserrat_500Medium",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderMin: {
    fontSize: 12,
    color: "#777",
    width: 20,
    textAlign: "center",
    fontFamily: "Montserrat_400Regular",
  },
  sliderTrack: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 4,
    backgroundColor: "#e1e1e1",
    borderRadius: 2,
    marginHorizontal: 8,
  },
  sliderTick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: -6,
  },
  sliderTickActive: {
    backgroundColor: "#4a6da7",
    borderColor: "#4a6da7",
  },
  sliderMax: {
    fontSize: 12,
    color: "#777",
    width: 30,
    textAlign: "center",
    fontFamily: "Montserrat_400Regular",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    color: "#ffffff",
    marginLeft: 12,
    flex: 1,
    fontFamily: "Montserrat_600SemiBold",
  },
  modalScoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
  },
  modalScoreText: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "Montserrat_700Bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  modalSectionTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    fontFamily: "Montserrat_600SemiBold",
  },
  responseRow: {
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontFamily: "Montserrat_500Medium",
  },
  responseValue: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Montserrat_400Regular",
  },
  viewResumeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  viewResumeText: {
    color: "#ffffff",
    marginLeft: 8,
    fontFamily: "Montserrat_600SemiBold",
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  scoreGridItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreGridLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontFamily: "Montserrat_500Medium",
  },
  scoreGridValue: {
    fontSize: 18,
    color: "#4a6da7",
    fontFamily: "Montserrat_700Bold",
  },
  analysisSection: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 16,
  },
  analysisSectionTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  analysisItem: {
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontFamily: "Montserrat_500Medium",
  },
  analysisText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: "Montserrat_400Regular",
  },
  submissionDate: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    fontFamily: "Montserrat_400Regular",
  },
  sortDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    zIndex: 10,
  },
  sortDropdownText: {
    fontSize: 14,
    color: "#4a6da7",
    marginRight: 8,
    fontFamily: "Montserrat_500Medium",
  },
  sortOptions: {
    position: "absolute",
    top: 42,
    left: 0,
    width: 220,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 6,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    maxHeight: 300,
  },
  sortOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activeSortOption: {
    backgroundColor: "#4a6da7",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#4a6da7",
    fontFamily: "Montserrat_500Medium",
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  filterModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  filterModalTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
  },
  filterModalCloseButton: {
    padding: 4,
  },
  filterModalContent: {
    padding: 20,
  },
  filterModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  applyFilterButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  applyFilterText: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "Montserrat_600SemiBold",
  },
  jobDescriptionContainer: {
    backgroundColor: "#f5f7fa",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  jobDescriptionLabel: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
    marginBottom: 4,
  },
  jobDescriptionText: {
    fontSize: 14,
    color: "#555",
    fontFamily: "Montserrat_400Regular",
  },
  jobDescriptionMore: {
    fontSize: 12,
    color: "#4a6da7",
    fontFamily: "Montserrat_500Medium",
    marginTop: 4,
    textAlign: "right",
  },
});
