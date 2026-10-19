// com.pds.tokens — generated token data (pure Kotlin, no Android or Compose dependency, ADR
// 0016), so it's a plain Kotlin/JVM library any Android or Compose module can depend on.
// Sources: src/main/kotlin/com/pds/tokens/ — generated, do not edit.
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.jvm)
}

group = "com.pds"
version = "0.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}
