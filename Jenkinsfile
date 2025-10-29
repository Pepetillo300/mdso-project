pipeline {
    agent any
    tools {
        maven '3.9.11'
        dockerTool 'docker'
    }

    environment {
        DOCKERHUB_REPO = 'pepetillo300/mdso-project'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        MINIKUBE_IP = '192.168.67.2'
        MINIKUBE_PORT = '8443'
    }

    stages {
        stage('Checkout') {
            steps {
                // Clona el repositorio
                git branch: 'deployMinikube', url: 'https://github.com/Pepetillo300/mdso-project.git'
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

    //     stage('Deploy to Minikube') {
    //         steps {
    //             echo "Desplegando en Minikube..."
    //             script {
    //                 sh '''
    //                     kubectl config use-context minikube

    //                     echo "Aplicando manifiestos de Kubernetes..."
    //                     kubectl apply -f k8s/

    //                     echo "Actualizando imagen del deployment..."
    //                     kubectl set image deployment/mdso-deployment mdso=${DOCKERHUB_REPO}:${IMAGE_TAG} || echo "Deployment aún no existe, intentando aplicar de nuevo..."

    //                     # Espera a que el rollout termine (opcional, pero recomendable)
    //                     kubectl rollout status deployment/mdso-deployment --timeout=120s
    //                 '''
    //             }
    //         }
    //     }
    // }

        stage('Deploy to Minikube') {
            steps {
                script {
                    withKubeConfig(
                        credentialsId: 'kubeconfig-minikube',            
                        serverUrl: "https://${MINIKUBE_IP}:${MINIKUBE_PORT}",
                        clusterName: 'minikube',                         
                        contextName: 'minikube',                         
                        namespace: 'default',                            
                        caCertificate: ''                                
                    ) {
                        sh '''
                        echo "Aplicando manifiestos de Kubernetes..."
                        kubectl apply -f k8s/

                        echo "Actualizando imagen del deployment..."
                        kubectl set image deployment/mdso-deployment mdso=${DOCKERHUB_REPO}:${IMAGE_TAG} || \
                            echo "Deployment aún no existe, intentando aplicar de nuevo..."

                        echo "Esperando rollout..."
                        kubectl rollout status deployment/mdso-deployment --timeout=120s
                        '''
                    }
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