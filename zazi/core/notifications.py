import boto3


def create_topic(topic_name):
    sns = boto3.client('sns')
    response = sns.create_topic(Name=topic_name)

    return response


def get_topic_subscriptions(topic_arn=None):
    # Create an SNS client
    sns = boto3.client('sns')

    if topic_arn is None:
        # Call SNS to list the first 100 subscriptions for the specified topic
        response = sns.list_subscriptions()
    else:
        # Call SNS to list the first 100 subscriptions for the specified topic
        response = sns.list_subscriptions_by_topic(TopicArn=topic_arn)

    # Get a list of subscriptions from the response
    return response['Subscriptions']


def get_topics(topic_arn=None):
    # Create an SNS client
    sns = boto3.client('sns')

    response = sns.list_topics()
    
    # Get a list of subscriptions from the response
    return response['Topics']


#-----------


def publish_message_to_topic(topic_arn, message):
    # Create an SNS client
    sns = boto3.client('sns')

    # Publish a simple message to the specified SNS topic
    response = sns.publish(
        TopicArn=topic_arn,
        Message=message
    )

    # Print out the response
    return response
    