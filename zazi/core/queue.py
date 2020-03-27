import boto3
import logging

from zazi.core import json

from botocore.exceptions import ClientError


#------------

logger = logging.getLogger(__name__)

#------------


def create_queue(queue_name, delay_seconds=60, message_retention_period=86400):
    # Create SQS client
    sqs = boto3.client('sqs')

    # Create a SQS queue
    return sqs.create_queue(
        QueueName=queue_name,
        Attributes={
            'DelaySeconds': '%d' % delay_seconds,
            'MessageRetentionPeriod': '%d' % message_retention_period
        }
    )


def create_dead_letter_queue(queue_url, dead_letter_queue_arn):
    # Create SQS client
    sqs = boto3.client('sqs')

    redrive_policy = {
        'deadLetterTargetArn': dead_letter_queue_arn,
        'maxReceiveCount': '10'
    }

    # Configure queue to send messages to dead letter queue
    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={
            'RedrivePolicy': json.dumps(redrive_policy)
        }
    )


#-------------


def delete_queue(queue_url):
    # Create SQS client
    sqs = boto3.client('sqs')

    # Delete SQS queue
    sqs.delete_queue(QueueUrl=queue_url)


def get_queue_url(queue_name):
    # Create SQS client
    sqs = boto3.client('sqs')

    # Get URL for SQS queue
    response = sqs.get_queue_url(QueueName=queue_name)

    return response['QueueUrl']

#------------


def get_or_create_queue(name):
    try:
        sqs = boto3.resource('sqs')
        return sqs.get_queue_by_name(QueueName=name)
    except Exception as e:
        logger.exception(e)

    try:
        return create_queue(name)
    except Exception as e:
        logger.exception(e)


#-----------


def retrieve_sqs_messages(
    sqs_queue_name, 
    num_msgs=1, 
    wait_time=20, 
    visibility_time=5
):
    """Retrieve messages from an SQS queue

    The retrieved messages are not deleted from the queue.

    :param sqs_queue_name: Name of existing SQS queue
    :param num_msgs: Number of messages to retrieve (1-10)
    :param wait_time: Number of seconds to wait if no messages in queue
    :param visibility_time: Number of seconds to make retrieved messages
        hidden from subsequent retrieval requests

    :return: List of retrieved messages. If no messages are available, returned
        list is empty. If error, returns None.
    """

    # Validate number of messages to retrieve
    if num_msgs < 1:
        num_msgs = 1
    elif num_msgs > 10:
        num_msgs = 10

    # Retrieve messages from an SQS queue
    try:
        queue = get_or_create_queue(sqs_queue_name)
        msgs = queue.receive_message(
            MaxNumberOfMessages=num_msgs,
            WaitTimeSeconds=wait_time,
            VisibilityTimeout=visibility_time)
    except ClientError as e:
        logging.error(e)
        return None

    # Return the list of retrieved messages
    return msgs['Messages']

#------------


def delete_sqs_message(sqs_queue_name, msg_receipt_handle):
    """Delete a message from an SQS queue

    :param sqs_queue_url: Name of existing SQS queue
    :param msg_receipt_handle: Receipt handle value of retrieved message
    """

    # Delete the message from the SQS queue
    queue = get_or_create_queue(sqs_queue_name)
    queue.delete_message(ReceiptHandle=msg_receipt_handle)


def send_sqs_message(sqs_queue_name, message_body, message_attributes=None, entries=None):
    """

    :param sqs_queue_name: Name of existing SQS queue
    :param message_body: String message body
    :param message_attributes: String message body
    :return: Dictionary containing information about the sent message. If
        error, returns None.
    """

    # Send the SQS message
    try:
        queue = get_or_create_queue(sqs_queue_name)

        if entries is not None:
            msg = queue.send_message(Entries=entries)
        else:
            msg = queue.send_message(
                MessageBody=message_body, 
                MessageAttributes=message_attributes or {})
    except ClientError as e:
        logging.exception(e)
        
        return None
    
    return msg
