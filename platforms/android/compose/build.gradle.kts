// com.pds.compose — Jetpack Compose components implementing design/contracts/ (ADR 0013, 0018).
// Foundation / UI / animation only — no Material, so components never inherit Material theming.
// Icon sources in src/main/kotlin/com/pds/compose/icons/ are generated (`npm run icons:kotlin`).
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.pds.compose"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures { compose = true }

    testOptions {
        // Robolectric runs the Compose UI tests on the JVM; it needs merged resources.
        unitTests.isIncludeAndroidResources = true
        // Robolectric's SDK 36 runtime reads FileDescriptor internals via jdk.internal.access,
        // which the JDK doesn't export to unnamed modules.
        unitTests.all { it.jvmArgs("--add-exports=java.base/jdk.internal.access=ALL-UNNAMED") }
    }
}

kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    api(project(":tokens"))

    implementation(platform(libs.compose.bom))
    api(libs.compose.foundation)
    api(libs.compose.ui)
    implementation(libs.compose.animation)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}
