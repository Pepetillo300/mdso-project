pipeline {
    agent any
    tools {
        maven '3.9.11'
    }

    environment {
        DOCKERHUB_REPO = 'pepetillo300/mdso-project'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                // Clona el repositorio
                git branch: 'develop', url: 'https://github.com/Pepetillo300/mdso-project.git'
            }
        }

        stage('Install') {
            steps {
                sh 'mvn clean install -B'
            }
        }

        // stage('Dependency Check') {
        //     steps {
        //         sh 'mvn org.owasp:dependency-check-maven:check'
        //     }
        // }

        stage ('Build Docker Image') {
            steps {
                echo "Construyendo la imagen Docker..."
                script {
                    docker.build("${DOCKERHUB_REPO}:${IMAGE_TAG}")
                }
            }
        }

        stage ('Push Docker Image') {
            steps {
                echo "Autenticando en Docker Hub..."
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'Docker-hub') {
                        echo "Subiendo la imagen Docker a Docker Hub..."
                        //Crear y subir la imagen con la etiqueta del número de build y 'latest'
                        def app = docker.image("${DOCKERHUB_REPO}:${IMAGE_TAG}")
                        app.push()
                        app.push('latest')
                    }
                }
            }
        }
        stage('Deploy to Minikube') {
            steps {
                echo "Desplegando aplicación en Minikube..."
                withCredentials([file(credentialsId: 'minikube-kubeconfig', variable: 'KUBECONFIG')]) {
                    sh '''
                        echo "Usando kubeconfig: $KUBECONFIG"
                        kubectl config use-context minikube
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml
                        kubectl get pods
                        kubectl get svc
                    '''
                }
            }
        }     
    }

    post {
        success {
            echo 'La construcción y subida de la imagen Docker se completó con éxito.'
        }
        failure {
            echo 'La construcción o subida de la imagen Docker falló.'
        }
    }
}