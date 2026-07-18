import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {ArrowLeft, ChevronDown, Eye, EyeOff, Lock, User} from "lucide-react-native";
import {Link, router, useLocalSearchParams} from "expo-router";
import React, {useState} from "react";

import LottieComponent from "@/components/lottieLoading";
import {apiBaseURL} from "../_utils/apiBaseURL";
import {perk} from "../_utils/colors";
import useAuthStore from "../_utils/authStore";
import {windowWidth} from "../_utils/screenDimensions";

interface ISignUpData {
    phone_number: string;
    first_name: string;
    last_name: string;
    gender: "M" | "F";
    age: number;
    role: "voter";
    password: string;
    confirm_password: string;
    polling_center: string;
}

export default function SignupScreen() {
    const [formData, setFormData] = useState({phoneNumber: "+254", firstName: "", lastName: "", password: "", confirmPassword: "", gender: "", age: ""});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const {logIn} = useAuthStore();
    const params = useLocalSearchParams();
    const genders = ["Male", "Female"];

    const updateFormData = (field: string, value: string) => {
        if (field === "phoneNumber" && !value.startsWith("+254")) value = "+254";
        setFormData((previous) => ({...previous, [field]: value}));
    };

    const validateForm = () => {
        const {phoneNumber, firstName, lastName, password, confirmPassword, gender, age} = formData;
        if (!phoneNumber || (!phoneNumber.startsWith("+2547") && !phoneNumber.startsWith("+2541")) || phoneNumber.length !== 13) { Alert.alert("Check your phone number", "Enter a valid Kenyan number, for example +254 7XX XXX XXX."); return false; }
        if (!firstName.trim() || !lastName.trim()) { Alert.alert("Add your name", "Please enter your first and last name."); return false; }
        if (password.length < 6) { Alert.alert("Choose a longer password", "Your password needs at least 6 characters."); return false; }
        if (password !== confirmPassword) { Alert.alert("Passwords do not match", "Please check and try again."); return false; }
        if (!gender) { Alert.alert("Select your gender", "Please choose an option to continue."); return false; }
        if (!age || parseInt(age) < 18 || parseInt(age) > 80) { Alert.alert("Check your age", "Please enter an age between 18 and 80."); return false; }
        return true;
    };

    const handleSignup = () => {
        if (!validateForm()) return;
        setIsLoading(true);
        const data: ISignUpData = {phone_number: formData.phoneNumber, first_name: formData.firstName, last_name: formData.lastName, gender: formData.gender === "Male" ? "M" : "F", age: parseInt(formData.age), role: "voter", password: formData.password, confirm_password: formData.confirmPassword, polling_center: String(params.pollingCenter)};
        fetch(`${apiBaseURL}/api/accounts/signup/`, {method: "POST", headers: {Accept: "application/json", "Content-Type": "application/json"}, body: JSON.stringify({data, ward_code: params.ward})})
            .then((response) => response.json())
            .then((response) => {
                if (response.error) {
                    setIsLoading(false);
                    const message = response.details?.phone_number?.[0] ?? (typeof response.details === "string" ? response.details : "Please review your details and try again.");
                    setError(message);
                    Alert.alert(response.error === "Polling center not found" ? "Polling centre not found" : "Could not create account", message);
                    return;
                }
                if (response.message === "User signup successful" && typeof response.data?.token === "string") {
                    setTimeout(() => { logIn(response.data.token); setIsLoading(false); router.replace("/(tabs)"); }, 1200);
                } else { setIsLoading(false); Alert.alert("Could not create account", "Please try again shortly."); }
            })
            .catch(() => { setIsLoading(false); Alert.alert("Connection problem", "We could not create your account. Please try again."); });
    };

    if (isLoading) return <View style={styles.loading}><LottieComponent name="tea" backgroundColor="transparent" width={0.42 * windowWidth} /><Text style={styles.loadingTitle}>Things are boiling nicely …</Text><Text style={styles.loadingText}>Creating your KuraZetu account.</Text></View>;

    return <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back"><ArrowLeft size={20} color={perk.ink} /></TouchableOpacity>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Last step — join the community that keeps the count honest.</Text>

            <View style={styles.form}>
                <FieldLabel label="Phone number" />
                <View style={styles.phoneShell}><View style={styles.prefix}><View style={styles.flag}><View style={styles.flagRed} /></View><Text style={styles.prefixText}>+254</Text></View><TextInput style={styles.phoneInput} placeholder="712 345 678" placeholderTextColor={perk.mute2} value={formData.phoneNumber.replace("+254", "")} onChangeText={(text) => updateFormData("phoneNumber", `+254${text.replace(/^\+?254/, "")}`)} keyboardType="phone-pad" maxLength={9} /></View>

                <View style={styles.nameRow}><View style={styles.half}><FieldLabel label="First name" /><Input icon={<User size={17} color={perk.mute} />} value={formData.firstName} onChangeText={(value) => updateFormData("firstName", value)} placeholder="First name" /></View><View style={styles.half}><FieldLabel label="Last name" /><Input icon={<User size={17} color={perk.mute} />} value={formData.lastName} onChangeText={(value) => updateFormData("lastName", value)} placeholder="Last name" /></View></View>

                <FieldLabel label="Password" /><Input icon={<Lock size={17} color={perk.mute} />} value={formData.password} onChangeText={(value) => updateFormData("password", value)} placeholder="At least 6 characters" secureTextEntry={!showPassword} trailing={<TouchableOpacity onPress={() => setShowPassword((value) => !value)}><>{showPassword ? <EyeOff size={18} color={perk.mute} /> : <Eye size={18} color={perk.mute} />}</></TouchableOpacity>} />
                <FieldLabel label="Confirm password" /><Input icon={<Lock size={17} color={perk.mute} />} value={formData.confirmPassword} onChangeText={(value) => updateFormData("confirmPassword", value)} placeholder="Repeat your password" secureTextEntry={!showConfirmPassword} trailing={<TouchableOpacity onPress={() => setShowConfirmPassword((value) => !value)}><>{showConfirmPassword ? <EyeOff size={18} color={perk.mute} /> : <Eye size={18} color={perk.mute} />}</></TouchableOpacity>} />

                <View style={styles.demographicRow}><View style={styles.gender}><FieldLabel label="Gender" /><TouchableOpacity style={styles.selectShell} onPress={() => setShowGenderDropdown((value) => !value)}><Text style={[styles.selectText, formData.gender && styles.selectedText]}>{formData.gender || "Select"}</Text><ChevronDown size={17} color={perk.ink} /></TouchableOpacity>{showGenderDropdown && <View style={styles.dropdown}>{genders.map((gender) => <TouchableOpacity key={gender} style={styles.dropdownOption} onPress={() => { updateFormData("gender", gender); setShowGenderDropdown(false); }}><Text style={styles.dropdownText}>{gender}</Text></TouchableOpacity>)}</View>}</View><View style={styles.age}><FieldLabel label="Age" /><Input value={formData.age} onChangeText={(value) => updateFormData("age", value)} placeholder="24" keyboardType="numeric" /></View></View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleSignup} activeOpacity={0.85}><Text style={styles.createText}>Create account</Text><IonArrow /></TouchableOpacity>
            <View style={styles.loginLine}><Text style={styles.loginText}>Already have an account? </Text><Link href="/auth/login" asChild><TouchableOpacity><Text style={styles.loginLink}>Sign in</Text></TouchableOpacity></Link></View>
        </ScrollView>
    </View>;
}

function FieldLabel({label}: {label: string}) { return <Text style={styles.label}>{label}</Text>; }
function IonArrow() { return <Text style={styles.arrow}>→</Text>; }
function Input({icon, trailing, ...props}: any) { return <View style={styles.inputShell}>{icon ? <View style={styles.leading}>{icon}</View> : null}<TextInput {...props} style={styles.input} placeholderTextColor={perk.mute2} />{trailing ? <View style={styles.trailing}>{trailing}</View> : null}</View>; }

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: perk.card}, scrollContent: {paddingHorizontal: 22, paddingTop: 56, paddingBottom: 36},
    backButton: {width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: perk.surface, marginBottom: 17},
    title: {fontSize: 31, lineHeight: 35, letterSpacing: -1, fontWeight: "800", color: perk.ink}, subtitle: {marginTop: 9, maxWidth: 290, fontSize: 15, lineHeight: 22, color: perk.mute},
    form: {marginTop: 27}, label: {fontFamily: "SpaceMono-Regular", marginBottom: 8, fontSize: 10, fontWeight: "700", letterSpacing: 1.7, color: perk.copper, textTransform: "uppercase"},
    phoneShell: {height: 53, flexDirection: "row", alignItems: "center", borderRadius: 14, overflow: "hidden", borderWidth: 1.5, borderColor: perk.ink, marginBottom: 18}, prefix: {height: "100%", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: perk.surface, borderRightWidth: 1, borderRightColor: perk.rule16}, prefixText: {fontFamily: "SpaceMono-Regular", fontSize: 14, fontWeight: "700", color: perk.ink}, flag: {width: 19, height: 13, borderRadius: 2, overflow: "hidden", backgroundColor: perk.green, justifyContent: "center"}, flagRed: {height: 4, backgroundColor: "#c4302b", borderTopWidth: 1, borderBottomWidth: 1, borderColor: perk.card}, phoneInput: {flex: 1, height: "100%", paddingHorizontal: 14, fontSize: 16, fontWeight: "600", color: perk.ink},
    nameRow: {flexDirection: "row", gap: 10}, half: {flex: 1}, inputShell: {height: 51, marginBottom: 18, flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, borderColor: perk.ink, backgroundColor: perk.card}, leading: {paddingLeft: 13, paddingRight: 9}, input: {flex: 1, height: "100%", paddingHorizontal: 13, fontSize: 15, fontWeight: "600", color: perk.ink}, trailing: {paddingRight: 13},
    demographicRow: {flexDirection: "row", gap: 10}, gender: {flex: 1.25, zIndex: 2}, age: {flex: 0.75}, selectShell: {height: 51, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1.5, borderColor: perk.ink}, selectText: {fontSize: 15, color: perk.mute}, selectedText: {color: perk.ink}, dropdown: {position: "absolute", top: 72, left: 0, right: 0, paddingVertical: 4, borderRadius: 12, backgroundColor: perk.card, borderWidth: 1, borderColor: perk.rule16, shadowColor: perk.ink, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6}, dropdownOption: {paddingHorizontal: 14, paddingVertical: 12}, dropdownText: {fontSize: 14, fontWeight: "700", color: perk.ink},
    error: {marginTop: -8, marginBottom: 6, fontSize: 12, color: perk.coralDeep}, createButton: {height: 53, marginTop: 20, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: perk.lime, shadowColor: perk.limeDeep, shadowOpacity: 0.4, shadowRadius: 12, elevation: 3}, createText: {fontSize: 15, fontWeight: "800", color: perk.limeInk}, arrow: {fontSize: 21, lineHeight: 22, fontWeight: "800", color: perk.limeInk}, loginLine: {marginTop: 20, flexDirection: "row", justifyContent: "center"}, loginText: {fontSize: 13, color: perk.mute}, loginLink: {fontSize: 13, fontWeight: "800", color: perk.ink, textDecorationLine: "underline", textDecorationColor: perk.limeDeep, textDecorationStyle: "solid"},
    loading: {flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: perk.paper, paddingHorizontal: 28}, loadingTitle: {marginTop: 18, fontSize: 20, fontWeight: "800", color: perk.periwinkleDeep}, loadingText: {marginTop: 7, fontSize: 14, color: perk.mute},
});
