plugins {
    java
    application
}

group = "wester"
version = "1.0-SNAPSHOT"

val joglVersion = "2.5.0"

repositories {
    mavenCentral()
    maven {
        url = uri("https://jogamp.org/deployment/maven")
    }
}

dependencies {
    // JOGL core
    implementation("org.jogamp.jogl:jogl-all:$joglVersion")
    implementation("org.jogamp.gluegen:gluegen-rt:$joglVersion")

    // JOGL natives pour Windows, Linux, Mac
    runtimeOnly("org.jogamp.jogl:jogl-all:$joglVersion:natives-windows-amd64")
    runtimeOnly("org.jogamp.jogl:jogl-all:$joglVersion:natives-linux-amd64")
    runtimeOnly("org.jogamp.jogl:jogl-all:$joglVersion:natives-macosx-universal")
    runtimeOnly("org.jogamp.gluegen:gluegen-rt:$joglVersion:natives-windows-amd64")
    runtimeOnly("org.jogamp.gluegen:gluegen-rt:$joglVersion:natives-linux-amd64")
    runtimeOnly("org.jogamp.gluegen:gluegen-rt:$joglVersion:natives-macosx-universal")

    // JOML (math à la GLM)
    implementation("org.joml:joml:1.10.5")
}

application {
    mainClass.set("Main")
}
