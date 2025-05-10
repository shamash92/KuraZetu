import React, {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {windowHeight, windowWidth} from "../(utils)/screenDimensions";

import {Avatar} from "react-native-paper";
import IconComponent from "@/components/icons";
import {Link} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {handleLogout} from "../(utils)/auth";

const Profile = () => {
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string | null>("");
    const [lastName, setLastName] = useState<string | null>("");

    return (
        <View
            style={{
                flex: 1,
                flexDirection: "column",
                backgroundColor: "rgba(0,0,0,0.2)",
                width: 1 * windowWidth,
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <StatusBar backgroundColor={"transparent"} translucent />

            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    width: 1 * windowWidth,
                    // borderWidth: 4,
                }}
            >
                <View
                    style={{
                        // flex: 1,
                        backgroundColor: "#fcefee",
                        borderRadius: 20,
                        width: 0.9 * windowWidth,
                        height: 0.8 * windowHeight,
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            width: 0.9 * windowWidth,
                            height: 0.8 * windowHeight,
                            padding: 20,
                        }}
                    >
                        <View
                            style={{
                                // borderWidth: 1,
                                width: "100%",
                                paddingHorizontal: 10,
                                flexDirection: "column",
                                flex: 3,
                                alignItems: "center",
                                justifyContent: "center",
                                paddingTop: 10,
                            }}
                        >
                            <View>
                                <Avatar.Text
                                    label={
                                        firstName && lastName
                                            ? firstName.slice(0, 1) +
                                              lastName.slice(0, 1)
                                            : ""
                                    }
                                />
                            </View>

                            <View
                                style={{
                                    width: "100%",
                                    flexDirection: "column",
                                    flex: 1,
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        marginTop: 10,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: 16,
                                        }}
                                    >
                                        {firstName} {lastName}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        marginTop: 5,
                                    }}
                                >
                                    <Text>{phoneNumber}</Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={{
                                // borderWidth: 1,
                                width: "100%",
                                paddingHorizontal: 10,
                                flexDirection: "column",
                                flex: 7,
                                justifyContent: "space-between",
                                paddingBottom: 10,
                            }}
                        >
                            {/* Edit User */}
                            <TouchableOpacity
                                onPress={() => {}}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    // borderWidth: 1,
                                    marginTop: 10,
                                    backgroundColor: "#f0f0f0",
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 3,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <IconComponent
                                        color="black"
                                        iconGroup="ant"
                                        name="edit"
                                        size={24}
                                    />
                                </View>

                                <View
                                    style={{
                                        flex: 7,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text>{"Update Profile"}</Text>
                                </View>
                            </TouchableOpacity>

                            {/* OTA Updates */}
                            <TouchableOpacity
                                onPress={() => {}}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    // borderWidth: 1,
                                    marginTop: 10,
                                    backgroundColor: "#f0f0f0",
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 3,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <IconComponent
                                        color="black"
                                        iconGroup="feather"
                                        name="download-cloud"
                                        size={24}
                                    />
                                </View>

                                <View
                                    style={{
                                        flex: 7,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text>Coming soon (updates)</Text>
                                    {/* <UpdateComponent /> */}
                                </View>
                            </TouchableOpacity>

                            {/* Privacy Policy */}

                            <Link
                                href={"/(playConsole)/privacy"}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    paddingVertical: 10,
                                    // borderColor: "black",
                                    // borderWidth: 1,
                                }}
                                asChild
                            >
                                <View
                                    style={{
                                        // borderWidth: 1,
                                        marginTop: 10,
                                        backgroundColor: "#f0f0f0",
                                        borderRadius: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 3,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 0.2 * windowWidth,
                                        }}
                                    >
                                        <IconComponent
                                            color="black"
                                            iconGroup="material-icons"
                                            name="privacy-tip"
                                            size={24}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flex: 7,
                                            flexDirection: "row",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            // marginLeft: 20,
                                            // borderWidth: 1,
                                            // borderColor: "red",
                                            width: 0.4 * windowWidth,
                                        }}
                                    >
                                        <Text>{"Privacy Policy"}</Text>
                                    </View>
                                </View>
                            </Link>

                            {/* Contact Us */}

                            <Link
                                href={`/help`}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    paddingVertical: 10,
                                }}
                                asChild
                            >
                                <View
                                    style={{
                                        // borderWidth: 1,

                                        marginTop: 10,
                                        backgroundColor: "#f0f0f0",
                                        borderRadius: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 3,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 0.2 * windowWidth,
                                        }}
                                    >
                                        <IconComponent
                                            color="black"
                                            iconGroup="material-icons"
                                            name="email"
                                            size={24}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flex: 7,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            // marginLeft: 20,
                                            // borderWidth: 1,
                                            // borderColor: "red",
                                            // width: 0.4 * windowWidth,
                                        }}
                                    >
                                        <Text>{"Contact Us"}</Text>
                                    </View>
                                </View>
                            </Link>

                            {/* Account Delete */}

                            <Link
                                href={"/(playConsole)/account-delete"}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    paddingVertical: 10,
                                    // borderColor: "black",
                                    // borderWidth: 1,
                                }}
                                asChild
                            >
                                <View
                                    style={{
                                        // borderWidth: 1,

                                        marginTop: 10,
                                        backgroundColor: "#f0f0f0",
                                        borderRadius: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 3,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 0.2 * windowWidth,
                                        }}
                                    >
                                        <IconComponent
                                            color="black"
                                            iconGroup="ant"
                                            name="deleteuser"
                                            size={24}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flex: 7,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                            // marginLeft: 20,
                                            // borderWidth: 1,
                                            // borderColor: "red",
                                            // width: 0.4 * windowWidth,
                                        }}
                                    >
                                        <Text>{"Account Delete"}</Text>
                                    </View>
                                </View>
                            </Link>

                            {/* Logout */}
                            <TouchableOpacity
                                onPress={handleLogout}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                    marginTop: 30,
                                    backgroundColor: "#fc5c9c",
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 3,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <IconComponent
                                        color="white"
                                        iconGroup="material-community"
                                        name="location-exit"
                                        size={24}
                                    />
                                </View>

                                <View
                                    style={{
                                        flex: 7,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: "bold",
                                            color: "white",
                                            fontSize: 18,
                                        }}
                                    >
                                        {"Logout"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Profile;
