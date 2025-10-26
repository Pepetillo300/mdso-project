pipeline {
    agent any
    tools {
        maven '3.9.11'
        dockerTool 'docker'
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
                    withCredentials([usernamePassword(credentialsId: 'Docker-hub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "Intentando login en Docker Hub..."
                            docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
                            
                            echo "Subiendo imagen ${DOCKERHUB_REPO}:${IMAGE_TAG}..."
                            docker push ${DOCKERHUB_REPO}:${IMAGE_TAG}
                            
                            echo "Subiendo tag latest..."
                            docker push ${DOCKERHUB_REPO}:latest
                        '''
                    }
                }
            }
        }
        stage('Deploy to Minikube') {
            steps {
                echo "Desplegando aplicación en Minikube..."
                sh '''
                    # Descargar kubectl si no existe
                    if [ ! -f ./kubectl ]; then
                        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                        chmod +x ./kubectl
                    fi

                    # Aplica manifiestos ignorando validación y TLS
                    ./kubectl apply --validate=false --insecure-skip-tls-verify -f k8s/deployment.yaml
                    ./kubectl apply --validate=false --insecure-skip-tls-verify -f k8s/service.yaml

                    # Listar recursos para verificar despliegue
                    ./kubectl get pods --insecure-skip-tls-verify
                    ./kubectl get svc --insecure-skip-tls-verify
                '''
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