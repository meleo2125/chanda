import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/config";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.9;

export default function CreateForm() {
  const { userToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState("basic"); // basic, fields, hr
  const [hrInputMethod, setHrInputMethod] = useState("manual"); // manual or jd
  const [jdParsingLoading, setJdParsingLoading] = useState(false);
  const [fullJobDescription, setFullJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  // Load Montserrat fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    console.log(
      "CreateForm - Auth token status:",
      userToken ? "Present" : "Missing"
    );
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fields: [
      {
        id: "1",
        type: "text",
        label: "Full Name",
        required: true,
        options: [],
      },
      {
        id: "2",
        type: "email",
        label: "Email Address",
        required: true,
        options: [],
      },
      {
        id: "3",
        type: "tel",
        label: "Phone Number",
        required: false,
        options: [],
      },
    ],
    hrRequirements: {
      job_id: "",
      role: "",
      experience_required: {
        minimum: 0,
        maximum: 0,
        preferred_industry: "",
      },
      notice_period: {
        required: "",
        preferred: "",
      },
      location: {
        city: "",
        state: "",
        country: "",
        remote_option: "",
      },
      required_skills: [],
      preferred_skills: [],
      qualifications: [],
      job_description: "",
    },
  });

  const addField = () => {
    const newId = (formData.fields.length + 1).toString();
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        { id: newId, type: "text", label: "", required: false, options: [] },
      ],
    });
  };

  const removeField = (id) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((field) => field.id !== id),
    });
  };

  const updateField = (id, key, value) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      ),
    });
  };

  const addOption = (fieldId) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((field) => {
        if (field.id === fieldId) {
          const options = [...field.options, ""];
          return { ...field, options };
        }
        return field;
      }),
    });
  };

  const updateOption = (fieldId, index, value) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((field) => {
        if (field.id === fieldId) {
          const options = [...field.options];
          options[index] = value;
          return { ...field, options };
        }
        return field;
      }),
    });
  };

  const removeOption = (fieldId, index) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((field) => {
        if (field.id === fieldId) {
          const options = [...field.options];
          options.splice(index, 1);
          return { ...field, options };
        }
        return field;
      }),
    });
  };

  const updateHrRequirements = (path, value) => {
    const pathArray = path.split(".");
    const newHrRequirements = { ...formData.hrRequirements };

    let current = newHrRequirements;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }

    current[pathArray[pathArray.length - 1]] = value;

    setFormData({
      ...formData,
      hrRequirements: newHrRequirements,
    });
  };

  const addHrRequirementItem = (arrayPath, value = "") => {
    const pathArray = arrayPath.split(".");
    const newHrRequirements = { ...formData.hrRequirements };

    let current = newHrRequirements;
    for (let i = 0; i < pathArray.length; i++) {
      current = current[pathArray[i]];
    }

    current.push(value);

    setFormData({
      ...formData,
      hrRequirements: newHrRequirements,
    });
  };

  const removeHrRequirementItem = (arrayPath, index) => {
    const pathArray = arrayPath.split(".");
    const newHrRequirements = { ...formData.hrRequirements };

    let current = newHrRequirements;
    for (let i = 0; i < pathArray.length; i++) {
      current = current[pathArray[i]];
    }

    current.splice(index, 1);

    setFormData({
      ...formData,
      hrRequirements: newHrRequirements,
    });
  };

  const updateHrRequirementItem = (arrayPath, index, value) => {
    const pathArray = arrayPath.split(".");
    const newHrRequirements = { ...formData.hrRequirements };

    let current = newHrRequirements;
    for (let i = 0; i < pathArray.length; i++) {
      current = current[pathArray[i]];
    }

    current[index] = value;

    setFormData({
      ...formData,
      hrRequirements: newHrRequirements,
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log("Form data being sent:", JSON.stringify(formData));

      const response = await fetch(`${API_URL}/api/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": userToken,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Form creation response:", data);

      if (response.ok) {
        Alert.alert("Success", "Form created successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to create form");
      }
    } catch (error) {
      console.error("Form creation error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parseJobDescription = async () => {
    if (!fullJobDescription.trim()) {
      Alert.alert("Error", "Please enter a job description to parse");
      return;
    }

    try {
      setJdParsingLoading(true);

      // First try the test endpoint to check connectivity
      try {
        console.log("Testing connectivity with test endpoint...");
        const testResponse = await fetch(`${API_URL}/api/test-jd-parse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobDescription: fullJobDescription }),
        });

        const testData = await testResponse.json();
        console.log("Test endpoint response:", testData);
      } catch (testError) {
        console.error("Test endpoint error:", testError);
        // Continue anyway to try the real endpoint
      }

      // Make API call to backend service that uses Gemini to parse the job description
      const response = await fetch(`${API_URL}/api/parse-job-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": userToken,
        },
        body: JSON.stringify({ jobDescription: fullJobDescription }),
      });

      console.log("JD Parsing Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("JD Parsing Error:", response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (response.ok) {
        // Update the form data with the parsed information
        const newHrRequirements = {
          ...formData.hrRequirements,
          job_id: data.job_id || formData.hrRequirements.job_id,
          role: data.role || formData.hrRequirements.role,
          experience_required: {
            minimum:
              data.minimum_experience ||
              formData.hrRequirements.experience_required.minimum,
            maximum:
              data.maximum_experience ||
              formData.hrRequirements.experience_required.maximum,
            preferred_industry:
              data.industry ||
              formData.hrRequirements.experience_required.preferred_industry,
          },
          notice_period: {
            required:
              data.notice_period ||
              formData.hrRequirements.notice_period.required,
            preferred:
              data.preferred_notice_period ||
              formData.hrRequirements.notice_period.preferred,
          },
          location: {
            city: data.city || formData.hrRequirements.location.city,
            state: data.state || formData.hrRequirements.location.state,
            country: data.country || formData.hrRequirements.location.country,
            remote_option:
              data.remote_option ||
              formData.hrRequirements.location.remote_option,
          },
          required_skills:
            data.required_skills || formData.hrRequirements.required_skills,
          preferred_skills:
            data.preferred_skills || formData.hrRequirements.preferred_skills,
          qualifications:
            data.qualifications || formData.hrRequirements.qualifications,
          job_description: fullJobDescription,
        };

        setFormData({
          ...formData,
          hrRequirements: newHrRequirements,
        });

        Alert.alert(
          "Success",
          "Job description parsed successfully! You can now review and edit all fields."
        );
      } else {
        Alert.alert("Error", data.message || "Failed to parse job description");
      }
    } catch (error) {
      console.error("Error parsing job description:", error);
      console.log("userToken available:", !!userToken);
      console.log("API URL being used:", API_URL);
      Alert.alert(
        "Error",
        "An unexpected error occurred while parsing the job description. Please check your connection and try again."
      );
    } finally {
      setJdParsingLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a form title");
      return false;
    }

    for (const field of formData.fields) {
      if (!field.label.trim()) {
        Alert.alert("Error", "All fields must have a label");
        return false;
      }

      if (
        (field.type === "select" ||
          field.type === "radio" ||
          field.type === "checkbox") &&
        field.options.length < 1
      ) {
        Alert.alert("Error", `${field.label} needs at least one option`);
        return false;
      }
    }

    return true;
  };

  const renderFieldOptions = (field) => {
    if (
      field.type === "select" ||
      field.type === "radio" ||
      field.type === "checkbox"
    ) {
      return (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>Options:</Text>
          {field.options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                value={option}
                onChangeText={(text) => updateOption(field.id, index, text)}
                placeholder="Option text"
              />
              <TouchableOpacity
                style={styles.removeOptionButton}
                onPress={() => removeOption(field.id, index)}
              >
                <Ionicons name="close-circle" size={24} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addOptionButton}
            onPress={() => addOption(field.id)}
          >
            <Ionicons name="add-circle" size={20} color="#4a6da7" />
            <Text style={styles.addOptionText}>Add Option</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4a6da7" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Recruitment Form</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  currentSection === "basic"
                    ? "33%"
                    : currentSection === "fields"
                    ? "66%"
                    : "100%",
              },
            ]}
          />
        </View>

        <View style={styles.stepsContainer}>
          <TouchableOpacity
            style={[
              styles.stepButton,
              currentSection === "basic" && styles.activeStep,
            ]}
            onPress={() => setCurrentSection("basic")}
          >
            <View
              style={[
                styles.stepCircle,
                currentSection === "basic"
                  ? styles.activeStepCircle
                  : currentSection === "fields" || currentSection === "hr"
                  ? styles.completedStepCircle
                  : {},
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentSection === "basic" ||
                  currentSection === "fields" ||
                  currentSection === "hr"
                    ? styles.activeStepNumber
                    : {},
                ]}
              >
                1
              </Text>
            </View>
            <Text
              style={[
                styles.stepText,
                currentSection === "basic" && styles.activeStepText,
              ]}
            >
              Basics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stepButton,
              currentSection === "fields" && styles.activeStep,
            ]}
            onPress={() =>
              formData.title
                ? setCurrentSection("fields")
                : Alert.alert("Required", "Please enter a form title first")
            }
          >
            <View
              style={[
                styles.stepCircle,
                currentSection === "fields"
                  ? styles.activeStepCircle
                  : currentSection === "hr"
                  ? styles.completedStepCircle
                  : {},
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentSection === "fields" || currentSection === "hr"
                    ? styles.activeStepNumber
                    : {},
                ]}
              >
                2
              </Text>
            </View>
            <Text
              style={[
                styles.stepText,
                currentSection === "fields" && styles.activeStepText,
              ]}
            >
              Fields
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stepButton,
              currentSection === "hr" && styles.activeStep,
            ]}
            onPress={() =>
              formData.fields.length > 0
                ? setCurrentSection("hr")
                : Alert.alert("Required", "Please add at least one field first")
            }
          >
            <View
              style={[
                styles.stepCircle,
                currentSection === "hr" && styles.activeStepCircle,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentSection === "hr" && styles.activeStepNumber,
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepText,
                currentSection === "hr" && styles.activeStepText,
              ]}
            >
              HR Requirements
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {currentSection === "basic" && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={24} color="#4a6da7" />
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Form Title*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter form title"
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholderTextColor="#9DA3B4"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter form description"
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9DA3B4"
                />

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => {
                    if (!formData.title) {
                      Alert.alert("Required", "Please enter a form title");
                      return;
                    }
                    setCurrentSection("fields");
                  }}
                >
                  <Text style={styles.nextButtonText}>Next: Form Fields</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {hrInputMethod === "jd" && fullJobDescription.trim() && (
                  <View style={styles.parsedIndicator}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#4a6da7"
                    />
                    <Text style={styles.parsedIndicatorText}>
                      Fields populated using AI. You can edit any field as
                      needed.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {currentSection === "fields" && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={24} color="#4a6da7" />
                <Text style={styles.sectionTitle}>Form Fields</Text>
              </View>

              <View style={styles.formCard}>
                {formData.fields.map((field) => (
                  <View key={field.id} style={styles.fieldCard}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldNumber}>Field {field.id}</Text>
                      {formData.fields.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeFieldButton}
                          onPress={() => removeField(field.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff6b6b"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Field Label *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={field.label}
                        onChangeText={(text) =>
                          updateField(field.id, "label", text)
                        }
                        placeholder="Enter field label"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Field Type</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={field.type}
                          style={styles.picker}
                          onValueChange={(value) =>
                            updateField(field.id, "type", value)
                          }
                        >
                          <Picker.Item label="Text" value="text" />
                          <Picker.Item label="Email" value="email" />
                          <Picker.Item label="Phone" value="tel" />
                          <Picker.Item label="Number" value="number" />
                          <Picker.Item label="Dropdown" value="select" />
                          <Picker.Item label="Multiple Choice" value="radio" />
                          <Picker.Item label="Checkbox" value="checkbox" />
                          <Picker.Item label="Date" value="date" />
                          <Picker.Item label="Resume Upload" value="file" />
                          <Picker.Item label="Textarea" value="textarea" />
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.checkboxRow}>
                      <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() =>
                          updateField(field.id, "required", !field.required)
                        }
                      >
                        {field.required && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.checkboxLabel}>Required field</Text>
                    </View>

                    {renderFieldOptions(field)}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addFieldButton}
                  onPress={addField}
                >
                  <Ionicons name="add-circle" size={24} color="#4a6da7" />
                  <Text style={styles.addFieldText}>Add New Field</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentSection === "hr" && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={24} color="#4a6da7" />
                <Text style={styles.sectionTitle}>
                  Job Requirements (AI Scoring)
                </Text>
              </View>

              <View style={styles.formCard}>
                {/* Input Method Selector */}
                <View style={styles.inputMethodContainer}>
                  <Text style={styles.inputMethodLabel}>
                    Choose input method:
                  </Text>

                  <View style={styles.inputMethodOptions}>
                    <TouchableOpacity
                      style={[
                        styles.inputMethodButton,
                        hrInputMethod === "manual" &&
                          styles.inputMethodButtonActive,
                      ]}
                      onPress={() => setHrInputMethod("manual")}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={
                          hrInputMethod === "manual" ? "#4a6da7" : "#777777"
                        }
                      />
                      <Text
                        style={[
                          styles.inputMethodButtonText,
                          hrInputMethod === "manual" &&
                            styles.inputMethodButtonTextActive,
                        ]}
                      >
                        Manual Input
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.inputMethodButton,
                        hrInputMethod === "jd" &&
                          styles.inputMethodButtonActive,
                      ]}
                      onPress={() => setHrInputMethod("jd")}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color={hrInputMethod === "jd" ? "#4a6da7" : "#777777"}
                      />
                      <Text
                        style={[
                          styles.inputMethodButtonText,
                          hrInputMethod === "jd" &&
                            styles.inputMethodButtonTextActive,
                        ]}
                      >
                        Parse Job Description
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {hrInputMethod === "jd" && (
                  <View style={styles.jdInputContainer}>
                    <Text style={styles.inputLabel}>
                      Paste Full Job Description (JD)
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.jdTextArea]}
                      value={fullJobDescription}
                      onChangeText={setFullJobDescription}
                      placeholder="Paste the complete job description here..."
                      multiline
                      numberOfLines={10}
                    />
                    <TouchableOpacity
                      style={styles.parseButton}
                      onPress={parseJobDescription}
                      disabled={jdParsingLoading}
                    >
                      {jdParsingLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="flash-outline"
                            size={20}
                            color="#ffffff"
                          />
                          <Text style={styles.parseButtonText}>
                            Parse with AI
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.aiHelpText}>
                      <Text style={styles.aiHelpTextBold}>How it works: </Text>
                      AI will analyze the job description to extract key
                      information including role requirements, experience
                      levels, qualifications, skills, location preferences, and
                      other job details. The AI will fill in any missing fields
                      based on context (e.g., determining industry from role
                      descriptions). You can review and edit all fields after
                      parsing.
                    </Text>
                  </View>
                )}

                {/* Divider after job description parsing section */}
                {hrInputMethod === "jd" && (
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>
                      Review Parsed Information
                    </Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}

                {/* HR Form Fields - Always visible */}
                <Text style={styles.inputLabel}>Job ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.hrRequirements.job_id}
                  onChangeText={(text) => updateHrRequirements("job_id", text)}
                  placeholder="Enter job ID"
                />

                {hrInputMethod === "jd" && formData.hrRequirements.job_id && (
                  <View style={styles.parsedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4a6da7"
                    />
                    <Text style={styles.parsedIndicatorText}>
                      Fields populated by AI. Review and edit as needed.
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Role</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.hrRequirements.role}
                  onChangeText={(text) => updateHrRequirements("role", text)}
                  placeholder="Enter job role"
                />

                <Text style={styles.inputLabel}>Job Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.hrRequirements.job_description}
                  onChangeText={(text) =>
                    updateHrRequirements("job_description", text)
                  }
                  placeholder="Enter detailed job description"
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>
                    Experience Requirements
                  </Text>

                  <View style={styles.rowContainer}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Minimum (years)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.experience_required.minimum.toString()}
                        onChangeText={(text) =>
                          updateHrRequirements(
                            "experience_required.minimum",
                            Number(text) || 0
                          )
                        }
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Maximum (years)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.experience_required.maximum.toString()}
                        onChangeText={(text) =>
                          updateHrRequirements(
                            "experience_required.maximum",
                            Number(text) || 0
                          )
                        }
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Preferred Industry</Text>
                    <TextInput
                      style={styles.textInput}
                      value={
                        formData.hrRequirements.experience_required
                          .preferred_industry
                      }
                      onChangeText={(text) =>
                        updateHrRequirements(
                          "experience_required.preferred_industry",
                          text
                        )
                      }
                      placeholder="Enter preferred industry"
                    />
                  </View>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Notice Period</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Required Notice Period
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.hrRequirements.notice_period.required}
                      onChangeText={(text) =>
                        updateHrRequirements("notice_period.required", text)
                      }
                      placeholder="e.g., Immediate to 30 days"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Preferred Notice Period
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.hrRequirements.notice_period.preferred}
                      onChangeText={(text) =>
                        updateHrRequirements("notice_period.preferred", text)
                      }
                      placeholder="e.g., 15 days"
                    />
                  </View>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Location</Text>

                  <View style={styles.rowContainer}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>City</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.location.city}
                        onChangeText={(text) =>
                          updateHrRequirements("location.city", text)
                        }
                        placeholder="City"
                      />
                    </View>

                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.inputLabel}>State</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.location.state}
                        onChangeText={(text) =>
                          updateHrRequirements("location.state", text)
                        }
                        placeholder="State"
                      />
                    </View>
                  </View>

                  <View style={styles.rowContainer}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Country</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.location.country}
                        onChangeText={(text) =>
                          updateHrRequirements("location.country", text)
                        }
                        placeholder="Country"
                      />
                    </View>

                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Remote Option</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.hrRequirements.location.remote_option}
                        onChangeText={(text) =>
                          updateHrRequirements("location.remote_option", text)
                        }
                        placeholder="e.g., Hybrid, Remote, Onsite"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Required Skills</Text>

                  {formData.hrRequirements.required_skills.map(
                    (skill, index) => (
                      <View key={index} style={styles.itemRow}>
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          value={skill}
                          onChangeText={(text) =>
                            updateHrRequirementItem(
                              "required_skills",
                              index,
                              text
                            )
                          }
                          placeholder="Enter skill"
                        />
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() =>
                            removeHrRequirementItem("required_skills", index)
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ff6b6b"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => addHrRequirementItem("required_skills")}
                  >
                    <Ionicons name="add-circle" size={20} color="#4a6da7" />
                    <Text style={styles.addItemText}>Add Required Skill</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Preferred Skills</Text>

                  {formData.hrRequirements.preferred_skills.map(
                    (skill, index) => (
                      <View key={index} style={styles.itemRow}>
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          value={skill}
                          onChangeText={(text) =>
                            updateHrRequirementItem(
                              "preferred_skills",
                              index,
                              text
                            )
                          }
                          placeholder="Enter skill"
                        />
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() =>
                            removeHrRequirementItem("preferred_skills", index)
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ff6b6b"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => addHrRequirementItem("preferred_skills")}
                  >
                    <Ionicons name="add-circle" size={20} color="#4a6da7" />
                    <Text style={styles.addItemText}>Add Preferred Skill</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Qualifications</Text>

                  {formData.hrRequirements.qualifications.map(
                    (qualification, index) => (
                      <View key={index} style={styles.itemRow}>
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          value={qualification}
                          onChangeText={(text) =>
                            updateHrRequirementItem(
                              "qualifications",
                              index,
                              text
                            )
                          }
                          placeholder="Enter qualification"
                        />
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() =>
                            removeHrRequirementItem("qualifications", index)
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ff6b6b"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => addHrRequirementItem("qualifications")}
                  >
                    <Ionicons name="add-circle" size={20} color="#4a6da7" />
                    <Text style={styles.addItemText}>Add Qualification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* We'll add the navigation buttons at the bottom */}
          <View style={styles.navigationButtons}>
            {currentSection !== "basic" && (
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => {
                  if (currentSection === "fields") setCurrentSection("basic");
                  if (currentSection === "hr") setCurrentSection("fields");
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#4a6da7" />
                <Text style={styles.backStepButtonText}>Previous</Text>
              </TouchableOpacity>
            )}

            {currentSection === "hr" && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Create Form</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: "#2d3748",
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#e1e5eb",
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#4a6da7",
    borderRadius: 3,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepButton: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e1e5eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeStepCircle: {
    backgroundColor: "#4a6da7",
  },
  completedStepCircle: {
    backgroundColor: "#4a6da7",
  },
  stepNumber: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#9DA3B4",
  },
  activeStepNumber: {
    color: "#ffffff",
  },
  stepText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#9DA3B4",
  },
  activeStepText: {
    color: "#4a6da7",
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: "#2d3748",
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  inputLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 6,
  },
  input: {
    fontFamily: "Montserrat_400Regular",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2d3748",
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  nextButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  nextButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
    marginRight: 8,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 40,
  },
  backStepButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#4a6da7",
    borderRadius: 8,
  },
  backStepButtonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#4a6da7",
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
    marginRight: 8,
  },
  fieldCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fieldNumber: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: "#2d3748",
  },
  removeFieldButton: {
    padding: 4,
  },
  pickerContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#4a6da7",
    backgroundColor: "#4a6da7",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  optionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#2d3748",
    marginLeft: 8,
  },
  removeOptionButton: {
    marginLeft: 8,
    padding: 4,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  addOptionText: {
    fontFamily: "Montserrat_500Medium",
    color: "#4a6da7",
    fontSize: 14,
    marginLeft: 8,
  },
  addFieldButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addFieldText: {
    fontFamily: "Montserrat_500Medium",
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  subSection: {
    marginTop: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a6da7",
    marginBottom: 12,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f4fa",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  addItemText: {
    fontSize: 14,
    color: "#4a6da7",
    marginLeft: 8,
  },
  removeItemButton: {
    marginLeft: 12,
  },
  textInput: {
    fontFamily: "Montserrat_400Regular",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2d3748",
  },
  inputMethodContainer: {
    marginBottom: 24,
    backgroundColor: "#f7f9fc",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e5eb",
  },
  inputMethodLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#2d3748",
    marginBottom: 12,
  },
  inputMethodOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    flex: 0.48,
    justifyContent: "center",
  },
  inputMethodButtonActive: {
    backgroundColor: "#f0f4fa",
    borderColor: "#4a6da7",
  },
  inputMethodButtonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#777777",
    fontSize: 14,
    marginLeft: 8,
  },
  inputMethodButtonTextActive: {
    color: "#4a6da7",
  },
  jdInputContainer: {
    marginBottom: 24,
    backgroundColor: "#f0f7ff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c2d1e8",
  },
  jdTextArea: {
    minHeight: 150,
    textAlignVertical: "top",
    backgroundColor: "#ffffff",
    marginTop: 8,
    marginBottom: 16,
  },
  parseButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  parseButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  aiHelpText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    color: "#4c5d7a",
    marginTop: 12,
    lineHeight: 18,
    backgroundColor: "#e6f0ff",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4a6da7",
  },
  aiHelpTextBold: {
    fontWeight: "bold",
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e1e5eb",
  },
  dividerText: {
    marginHorizontal: 10,
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#777777",
  },
  parsedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0ff",
    padding: 10,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#4a6da7",
  },
  parsedIndicatorText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: "#4c5d7a",
    marginLeft: 8,
    flex: 1,
  },
});
