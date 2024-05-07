import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../config/colors';
import Label from '../components/Label';
import {
  createSupportTicket,
  getAllChats,
  sendSupportMessage,
} from '../utils/supportFunctions';

const SupportScreen = ({
  navigation,
  route: {
    params: {trip, ticketId: propsTicketId, newTicket},
  },
}) => {
  console.log('newTicket: ', newTicket);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [isNewTicket, setIsNewTicket] = useState(newTicket);
  const [ticketId, setTicketId] = useState(propsTicketId);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (!newTicket && propsTicketId) {
      setLoadingChats(true);
      getAllChats({ticketId: propsTicketId})
        .then(response => {
          setChats(response.chats?.reverse());
          setLoadingChats(false);
        })
        .catch(error => {
          console.log('error in getting all chats: ', error);
          setLoadingChats(false);
        });
    }
  }, [newTicket, propsTicketId]);

  useEffect(() => {
    let interval = null;
    if (!newTicket && propsTicketId) {
      interval = setInterval(() => {
        getAllChats({ticketId: propsTicketId})
          .then(response => {
            setChats(response.chats?.reverse());
          })
          .catch(error => {
            console.log('error in getting all chats: ', error);
          });
      }, 10000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [newTicket, propsTicketId]);

  const renderChats = ({item, index}) => {
    return (
      <View
        key={index.toString()}
        style={item.isUser ? styles.userChat : styles.supportChat}>
        <Label
          text={item.text}
          textStyle={item.isUser ? styles.userChatText : styles.supportChatText}
        />
        <View style={styles.chatInfoContainer}>
          <Label
            text={`${new Date(item.createdAt).toLocaleDateString()}, ${new Date(
              item.createdAt,
            ).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`}
            textStyle={
              item.isUser ? styles.userChatTime : styles.supportChatTime
            }
          />
          {item.isUser ? (
            <MaterialCommunityIcons
              name={
                item._id
                  ? 'check'
                  : item.error
                  ? 'alert-outline'
                  : 'clock-time-three-outline'
              }
              size={16}
              color={item.error ? colors.red : colors.greyLighter}
            />
          ) : null}
        </View>
      </View>
    );
  };

  const sendMessage = useCallback(() => {
    setChats(prevChats => [
      {isUser: true, text: message, createdAt: Date.now()},
      ...prevChats,
    ]);
    if (isNewTicket) {
      createSupportTicket({tripId: trip._id, message: message})
        .then(response => {
          console.log('newTicket: ', response);
          setIsNewTicket(false);
          setChats(response.ticket.chats);
          setTicketId(response.ticket._id);
        })
        .catch(error => {
          console.log('error in creating new ticket: ', error.message);
        });
    } else {
      sendSupportMessage({ticketId: ticketId, message: message})
        .then(response => {
          console.log('send message: ', response);
          setChats(prevChats => {
            prevChats[0] = response.message;
            return [...prevChats];
          });
        })
        .catch(error => {
          console.log('message sending failed: ', error.message);
          setChats(prevChats => {
            prevChats[0].error = true;
            return [...prevChats];
          });
        });
    }
    console.log('Message: ', message);
    setMessage('');
  }, [isNewTicket, message, ticketId, trip._id]);
  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.flatlistContent}
        data={chats}
        inverted={true}
        renderItem={renderChats}
        style={styles.flatlist}
        refreshing={loadingChats}
      />
      {loadingChats ? (
        <View style={styles.loadingChatsContainer}>
          <Label text={'Loading chats'} textStyle={styles.loadingChats} />
          <ActivityIndicator size={'small'} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.messageContainer}>
        <TextInput
          multiline
          onChangeText={message => setMessage(message)}
          placeholder="Write a message"
          style={styles.messageInput}
          value={message}
        />
        <TouchableOpacity onPress={sendMessage}>
          <MaterialCommunityIcons
            color={colors.white}
            name="send-circle"
            size={44}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatInfoContainer: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  container: {
    backgroundColor: colors.neutralGrey,
    flex: 1,
  },
  flatlist: {
    backgroundColor: colors.neutralGrey,
    flex: 1,
    marginBottom: 48,
  },
  flatlistContent: {
    backgroundColor: colors.neutralGrey,
    padding: 16,
  },
  loadingChats: {
    color: colors.secondary,
    fontSize: 16,
    marginBottom: 8,
  },
  loadingChatsContainer: {
    alignItems: 'center',
    backgroundColor: colors.neutralGrey,
    justifyContent: 'center',
    marginBottom: 80,
  },
  messageContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    position: 'absolute',
    width: '100%',
  },
  messageInput: {
    color: colors.black,
    backgroundColor: colors.white,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: Dimensions.get('window').width - 68,
  },
  supportChat: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  supportChatText: {
    color: colors.secondary,
    fontSize: 16,
    textAlign: 'left',
  },
  supportChatTime: {
    alignSelf: 'flex-end',
    color: colors.primary,
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  userChat: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userChatText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'right',
  },
  userChatTime: {
    color: colors.greyLighter,
    fontStyle: 'italic',
    fontSize: 12,
    marginRight: 4,
    textAlign: 'right',
  },
});

export default SupportScreen;
