# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the application dependencies in the container
RUN npm install

# Copy the application code to the container
COPY . .

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]