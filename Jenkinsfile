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
                withCredentials([file(credentialsId: 'minikube-credentials', variable: 'KUBECONFIG')]) {
                    sh '''
                        ./kubectl apply --validate=false -f k8s/deployment.yaml
                        export KUBECONFIG=$KUBECONFIG_FILE
                        ./kubectl version --client
                        ./kubectl apply -f k8s/deployment.yaml
                        ./kubectl apply -f k8s/service.yaml
                        ./kubectl get pods
                        ./kubectl get svc
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